import { NextRequest, NextResponse } from "next/server"
import {
  getMetaConfig,
  getResolvedPageId,
  createCampaign,
  createAdSet,
  createCreative,
  createAd,
  formatMetaError,
} from "@/lib/meta-ad-api"

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

const GOALS = [
  { id: "traffic", label: "Website traffic", objective: "OUTCOME_TRAFFIC" },
  { id: "leads", label: "Leads (drive to signup page)", objective: "OUTCOME_TRAFFIC" },
  { id: "app", label: "App / download page", objective: "OUTCOME_TRAFFIC" },
]

async function generateCopy(goalLabel: string, url: string, businessHint: string): Promise<string> {
  if (!OPENAI_API_KEY) return "Check this out. Visit the link to get started."
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{
        role: "user",
        content: `Write one short sentence of ad copy for a Facebook/Instagram ad. Goal: ${goalLabel}. Destination: ${url}. ${businessHint} Return ONLY the ad copy, no quotes, under 125 characters.`,
      }],
      max_tokens: 80,
    }),
  })
  const data = await res.json()
  const copy = data.choices?.[0]?.message?.content?.trim()
  return copy && copy.length > 0 ? copy : "Get started today. Click the link."
}

export async function POST(request: NextRequest) {
  try {
    getMetaConfig()
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Meta API keys missing" },
      { status: 500 }
    )
  }

  try {
    const body = (await request.json()) as { goal?: string; budget?: number; totalBudgetCap?: number; url?: string; business?: string; autoStart?: boolean }
    const goalId = (body.goal || "traffic") as string
    const goal = GOALS.find((g) => g.id === goalId) || GOALS[0]
    const budgetDollars = Math.max(1, Math.min(50, Number(body.budget) || 8))
    const totalCap = body.totalBudgetCap != null && body.totalBudgetCap >= 1 ? Math.min(1000, Math.round(Number(body.totalBudgetCap))) : 0
    const url = (body.url || "https://www.uniquepickups.com").trim()
    const businessHint = (body.business || "Business: logistics / pickup / delivery.").trim()
    const autoStart = body.autoStart === true
    const status = autoStart ? "ACTIVE" : "PAUSED"
    const resolvedPageId = await getResolvedPageId()

    let copy = await generateCopy(goal.label, url, businessHint)
    copy = (copy || "").slice(0, 125)
    const campaignName = `AI ${goal.label} ${new Date().toISOString().slice(0, 10)}`

    const campaignRes = await createCampaign({ name: campaignName, objective: goal.objective, status })
    if (campaignRes.error) {
      return NextResponse.json({ error: formatMetaError(campaignRes.error), details: campaignRes }, { status: 400 })
    }
    const campaignId = campaignRes.id!

    const useLifetimeBudget = totalCap > 0
    if (useLifetimeBudget && totalCap < 30) {
      return NextResponse.json(
        { error: "Max total budget must be at least $30. Meta requires this minimum for ad set lifetime budgets or ads may not deliver." },
        { status: 400 }
      )
    }
    let adSetOpts: Parameters<typeof createAdSet>[0] = {
      name: `${campaignName} - Ad Set`,
      campaignId,
      status,
      pageId: resolvedPageId,
    }
    if (useLifetimeBudget) {
      const start = new Date(Date.now() + 2 * 60 * 1000)
      const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000)
      adSetOpts.lifetimeBudgetCents = Math.max(3001, Math.round(totalCap) * 100)
      adSetOpts.startTime = start.toISOString()
      adSetOpts.endTime = end.toISOString()
    } else {
      adSetOpts.dailyBudgetCents = budgetDollars * 100
    }

    const adSetRes = await createAdSet(adSetOpts)
    if (adSetRes.error) {
      return NextResponse.json({ error: formatMetaError(adSetRes.error), details: adSetRes }, { status: 400 })
    }
    const adSetId = adSetRes.id!

    const objectStorySpec = {
      page_id: resolvedPageId,
      link_data: { link: url, message: copy, name: campaignName },
    }
    const creativeRes = await createCreative({ name: `${campaignName} - Creative`, objectStorySpec })
    if (creativeRes.error) {
      return NextResponse.json({ error: formatMetaError(creativeRes.error), details: creativeRes }, { status: 400 })
    }

    const adRes = await createAd({
      name: `${campaignName} - Ad`,
      adsetId: adSetId,
      creativeId: creativeRes.id!,
      status,
    })
    if (adRes.error) {
      return NextResponse.json({ error: formatMetaError(adRes.error), details: adRes }, { status: 400 })
    }

    const usedCap = totalCap > 0
    const message = autoStart
      ? (usedCap
          ? `Campaign created with a $${totalCap} total cap (ACTIVE — running now). Facebook will stop when that amount is spent.`
          : "Campaign created (ACTIVE — running now).")
      : (usedCap
          ? `Campaign created with a $${totalCap} total cap. Turn it ON in Ads Manager when ready.`
          : "Campaign created. Turn it ON in Ads Manager when you're ready — we keep it paused so you don't spend until you approve.")
    return NextResponse.json({
      success: true,
      campaign_id: campaignId,
      name: campaignName,
      copy,
      daily_budget: totalCap > 0 ? undefined : budgetDollars,
      total_budget_cap: totalCap > 0 ? totalCap : undefined,
      goal: goal.label,
      message,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Quick launch failed" },
      { status: 500 }
    )
  }
}
