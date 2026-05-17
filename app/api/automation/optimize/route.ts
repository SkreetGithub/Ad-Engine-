import { NextRequest, NextResponse } from "next/server"
import { readStore, mergeInsights, type AnalyticsRow } from "@/lib/analytics-store"
import { formatMetaError } from "@/lib/format-meta-error"

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN
const META_AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID
const graphUrl = "https://graph.facebook.com/v21.0"

export interface OptimizeResult {
  success: boolean
  synced: boolean
  totalSpend: number
  maxTotalBudget: number
  remainingBudget: number
  actions: string[]
  paused_campaigns: string[]
  new_campaign_id?: string
  new_campaign_name?: string
  error?: string
}

/** Sync analytics from Meta into store (same logic as analytics/sync). */
async function syncAnalytics(): Promise<{ totalSpend: number; byCampaign: Map<string, { spend: number; clicks: number }> }> {
  if (!META_ACCESS_TOKEN || !META_AD_ACCOUNT_ID) {
    throw new Error("Missing Meta env vars")
  }
  const params = new URLSearchParams({
    access_token: META_ACCESS_TOKEN,
    level: "campaign",
    fields: "campaign_id,campaign_name,spend,impressions,clicks",
    date_preset: "last_7d",
    time_increment: "1",
  })
  const res = await fetch(`${graphUrl}/${META_AD_ACCOUNT_ID}/insights?${params.toString()}`)
  const data = await res.json()
  if (data.error) throw new Error(data.error.message || "Meta Insights API error")
  const rows: AnalyticsRow[] = (data.data || []).map(
    (r: {
      date_start?: string
      campaign_id?: string
      campaign_name?: string
      spend?: string
      impressions?: string
      clicks?: string
    }) => ({
      date: r.date_start || "",
      campaign_id: r.campaign_id || "",
      campaign_name: r.campaign_name || "",
      spend: parseFloat(r.spend || "0") || 0,
      impressions: parseInt(r.impressions || "0", 10) || 0,
      clicks: parseInt(r.clicks || "0", 10) || 0,
    })
  )
  await mergeInsights(rows)
  const store = await readStore()
  const byCampaign = new Map<string, { spend: number; clicks: number }>()
  let totalSpend = 0
  for (const r of store.rows) {
    totalSpend += r.spend
    const cur = byCampaign.get(r.campaign_id) || { spend: 0, clicks: 0 }
    cur.spend += r.spend
    cur.clicks += r.clicks
    byCampaign.set(r.campaign_id, cur)
  }
  return { totalSpend, byCampaign }
}

/** Pause a campaign via Meta API. */
async function pauseCampaign(campaignId: string): Promise<boolean> {
  if (!META_ACCESS_TOKEN || !META_AD_ACCOUNT_ID) return false
  const res = await fetch(
    `${graphUrl}/${campaignId}?access_token=${META_ACCESS_TOKEN}&status=PAUSED`,
    { method: "POST" }
  )
  const data = await res.json()
  return !data.error
}

/** Fetch campaign list from Meta. */
async function getCampaigns(): Promise<{ id: string; name: string; status: string; effective_status: string }[]> {
  if (!META_ACCESS_TOKEN || !META_AD_ACCOUNT_ID) return []
  const res = await fetch(
    `${graphUrl}/${META_AD_ACCOUNT_ID}/campaigns?access_token=${META_ACCESS_TOKEN}&fields=id,name,status,effective_status,daily_budget,created_time`
  )
  const data = await res.json()
  if (data.error) return []
  return (data.data || []).map((c: { id: string; name: string; status: string; effective_status?: string[] }) => ({
    id: c.id,
    name: c.name,
    status: c.status,
    effective_status: (c.effective_status?.[0] ?? c.status) || "",
  }))
}

export async function POST(request: NextRequest): Promise<NextResponse<OptimizeResult>> {
  if (!META_ACCESS_TOKEN || !META_AD_ACCOUNT_ID) {
    return NextResponse.json(
      { success: false, synced: false, totalSpend: 0, maxTotalBudget: 0, remainingBudget: 0, actions: [], paused_campaigns: [], error: "Missing Meta env vars" },
      { status: 500 }
    )
  }

  let maxTotalBudget = 50
  let autoStart = false
  try {
    const body = (await request.json()) as { maxTotalBudget?: number; autoStart?: boolean }
    if (body.maxTotalBudget != null && body.maxTotalBudget >= 1) {
      maxTotalBudget = Math.min(1000, Math.round(body.maxTotalBudget))
    }
    if (body.autoStart === true) autoStart = true
  } catch {
    // use default
  }

  const actions: string[] = []
  const pausedCampaigns: string[] = []

  try {
    // 1. Sync analytics so we have latest spend
    const { totalSpend, byCampaign } = await syncAnalytics()
    actions.push(`Synced analytics. Total spend (last 7d): $${totalSpend.toFixed(2)}. Max budget: $${maxTotalBudget}.`)
    const remainingBudget = Math.max(0, maxTotalBudget - totalSpend)

    // 2. If at or over budget, pause all active campaigns
    const campaigns = await getCampaigns()
    const active = campaigns.filter((c) => (c.effective_status || c.status || "").toUpperCase() === "ACTIVE")

    if (totalSpend >= maxTotalBudget || remainingBudget <= 0) {
      for (const c of active) {
        const ok = await pauseCampaign(c.id)
        if (ok) {
          pausedCampaigns.push(c.id)
          actions.push(`Paused "${c.name}" (at or over max budget).`)
        }
      }
      return NextResponse.json({
        success: true,
        synced: true,
        totalSpend,
        maxTotalBudget,
        remainingBudget: 0,
        actions,
        paused_campaigns: pausedCampaigns,
      })
    }

    // 3. Rank active campaigns by efficiency (clicks per dollar; low spend with 0 clicks = worst)
    const activeWithPerf = active.map((c) => {
      const perf = byCampaign.get(c.id) || { spend: 0, clicks: 0 }
      const efficiency = perf.spend > 0 ? perf.clicks / perf.spend : 0
      return { ...c, ...perf, efficiency }
    })
    activeWithPerf.sort((a, b) => a.efficiency - b.efficiency) // worst first

    // 4. Pause worst performer to free room for a new test (if we have more than one active)
    if (activeWithPerf.length > 1) {
      const worst = activeWithPerf[0]
      const ok = await pauseCampaign(worst.id)
      if (ok) {
        pausedCampaigns.push(worst.id)
        actions.push(`Paused worst performer "${worst.name}" ($${worst.spend.toFixed(2)} spend, ${worst.clicks} clicks) to run new test.`)
      }
    }

    // 5. Create new test campaign via rotate (uses lifetime_budget = cap so we stay within budget)
    const capForNew = Math.min(remainingBudget, 50)
    if (capForNew >= 1) {
      let baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_APP_URL || ""
      if (!baseUrl && request.url) {
        try { baseUrl = new URL(request.url).origin } catch {}
      }
      if (!baseUrl) baseUrl = "http://localhost:3550"
      const rotateRes = await fetch(`${baseUrl}/api/automation/rotate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalBudgetCap: Math.round(capForNew), autoStart }),
      })
      const rotateData = await rotateRes.json()
      if (rotateData.success && rotateData.new_campaign_id) {
        actions.push(`Created new test campaign "${rotateData.new_campaign_name}" with $${Math.round(capForNew)} cap. Turn it on in Ads Manager to run.`)
        return NextResponse.json({
          success: true,
          synced: true,
          totalSpend,
          maxTotalBudget,
          remainingBudget: remainingBudget - capForNew,
          actions,
          paused_campaigns: pausedCampaigns,
          new_campaign_id: rotateData.new_campaign_id,
          new_campaign_name: rotateData.new_campaign_name,
        })
      }
      if (rotateData.error) {
        actions.push(`Rotation failed: ${rotateData.error}.`)
      }
    } else {
      actions.push(`Remaining budget $${remainingBudget.toFixed(2)} is under $1; no new test created.`)
    }

    return NextResponse.json({
      success: true,
      synced: true,
      totalSpend,
      maxTotalBudget,
      remainingBudget,
      actions,
      paused_campaigns: pausedCampaigns,
    })
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        synced: false,
        totalSpend: 0,
        maxTotalBudget,
        remainingBudget: 0,
        actions,
        paused_campaigns: pausedCampaigns,
        error: formatMetaError(e instanceof Error ? e.message : "Optimize failed"),
      },
      { status: 500 }
    )
  }
}
