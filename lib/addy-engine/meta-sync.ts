import { mergeInsights, type AnalyticsRow } from "@/lib/analytics-store"
import type { RunningAd } from "@/lib/addy-engine/types"
import { updateRunningAd } from "@/lib/addy-engine/store"
import { updateCompany } from "@/lib/companies-store"

const graphUrl = "https://graph.facebook.com/v21.0"

export interface MetaCampaignInsight {
  campaign_id: string
  campaign_name: string
  spend: number
  impressions: number
  clicks: number
  ctr: number
  conversions: number
  purchaseValue: number
  profit: number
  profitRatio: number
}

export interface MetaSyncResult {
  ok: boolean
  error?: string
  campaigns: MetaCampaignInsight[]
  totalSpend: number
  totalProfit: number
  portfolioRatio: number
  adsUpdated: number
  syncedAt: string
}

function parseActionValue(actions?: unknown, actionValues?: unknown): number {
  let purchases = 0
  let value = 0
  if (Array.isArray(actions)) {
    for (const a of actions) {
      const row = a as { action_type?: string; value?: string }
      if (row.action_type === "purchase" || row.action_type === "omni_purchase") {
        purchases += parseInt(row.value || "0", 10) || 0
      }
    }
  }
  if (Array.isArray(actionValues)) {
    for (const a of actionValues) {
      const row = a as { action_type?: string; value?: string }
      if (
        row.action_type === "purchase" ||
        row.action_type === "omni_purchase" ||
        row.action_type === "offsite_conversion.fb_pixel_purchase"
      ) {
        value += parseFloat(row.value || "0") || 0
      }
    }
  }
  return value > 0 ? value : purchases * 0
}

export async function syncMetaForCompany(
  companyId: string,
  runningAds: RunningAd[]
): Promise<MetaSyncResult> {
  const token = process.env.META_ACCESS_TOKEN
  const accountId = process.env.META_AD_ACCOUNT_ID
  if (!token || !accountId) {
    return {
      ok: false,
      error: "Missing META_ACCESS_TOKEN or META_AD_ACCOUNT_ID in server environment.",
      campaigns: [],
      totalSpend: 0,
      totalProfit: 0,
      portfolioRatio: 0,
      adsUpdated: 0,
      syncedAt: new Date().toISOString(),
    }
  }

  const params = new URLSearchParams({
    access_token: token,
    level: "campaign",
    fields:
      "campaign_id,campaign_name,spend,impressions,clicks,ctr,actions,action_values,purchase_roas",
    date_preset: "today",
  })

  const res = await fetch(`${graphUrl}/${accountId}/insights?${params.toString()}`)
  const data = await res.json()

  if (data.error) {
    return {
      ok: false,
      error: data.error.message || "Meta Insights API error",
      campaigns: [],
      totalSpend: 0,
      totalProfit: 0,
      portfolioRatio: 0,
      adsUpdated: 0,
      syncedAt: new Date().toISOString(),
    }
  }

  const rows: AnalyticsRow[] = []
  const campaigns: MetaCampaignInsight[] = []

  for (const r of data.data || []) {
    const spend = parseFloat(r.spend || "0") || 0
    const clicks = parseInt(r.clicks || "0", 10) || 0
    const impressions = parseInt(r.impressions || "0", 10) || 0
    const ctr = parseFloat(r.ctr || "0") || (impressions > 0 ? (clicks / impressions) * 100 : 0)
    let purchaseValue = parseActionValue(r.actions, r.action_values)

    if (purchaseValue <= 0 && Array.isArray(r.purchase_roas)) {
      const roasEntry = r.purchase_roas.find(
        (p: { action_type?: string }) => p.action_type === "omni_purchase"
      ) as { value?: string } | undefined
      const roas = parseFloat(roasEntry?.value || "0") || 0
      if (roas > 0 && spend > 0) purchaseValue = roas * spend
    }

    const profit = purchaseValue - spend
    const profitRatio = spend > 0 ? purchaseValue / spend : 0
    let conversions = 0
    if (Array.isArray(r.actions)) {
      for (const a of r.actions) {
        const row = a as { action_type?: string; value?: string }
        if (row.action_type === "purchase" || row.action_type === "omni_purchase") {
          conversions += parseInt(row.value || "0", 10) || 0
        }
      }
    }

    campaigns.push({
      campaign_id: r.campaign_id || "",
      campaign_name: r.campaign_name || "",
      spend,
      impressions,
      clicks,
      ctr,
      conversions,
      purchaseValue,
      profit,
      profitRatio,
    })

    rows.push({
      date: r.date_start || new Date().toISOString().slice(0, 10),
      campaign_id: r.campaign_id || "",
      campaign_name: r.campaign_name || "",
      spend,
      impressions,
      clicks,
    })
  }

  if (rows.length) await mergeInsights(rows)

  let adsUpdated = 0
  const companyAds = runningAds.filter((a) => a.companyId === companyId)

  for (const ad of companyAds) {
    const match = campaigns.find(
      (c) =>
        c.campaign_name.toLowerCase().includes(ad.name.toLowerCase().slice(0, 12)) ||
        ad.name.toLowerCase().includes(c.campaign_name.toLowerCase().slice(0, 12))
    )
    if (match) {
      const underperformDays =
        match.profitRatio < 1.5 ? ad.underperformDays + 1 : 0
      await updateRunningAd(ad.id, {
        spendToday: match.spend,
        profitToday: match.profit,
        profitRatio: match.profitRatio,
        ctr: match.ctr,
        conversions: match.conversions,
        underperformDays,
      })
      adsUpdated++
    }
  }

  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0)
  const totalProfit = campaigns.reduce((s, c) => s + c.profit, 0)
  const portfolioRatio = totalSpend > 0 ? totalProfit / totalSpend + 1 : 0
  // profit ratio as ROAS: revenue/spend = (profit+spend)/spend
  const roas = totalSpend > 0 ? (totalProfit + totalSpend) / totalSpend : 0

  await updateCompany(companyId, {
    currentAdSpend: totalSpend,
    currentProfit: totalProfit,
    currentProfitRatio: roas,
  })

  return {
    ok: true,
    campaigns,
    totalSpend,
    totalProfit,
    portfolioRatio: roas,
    adsUpdated,
    syncedAt: new Date().toISOString(),
  }
}
