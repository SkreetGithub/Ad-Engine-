import { NextRequest, NextResponse } from "next/server"
import {
  getMetaConfig,
  createCampaign,
  createAdSet,
  createCreative,
  createAd,
  formatMetaErrorResponse,
} from "@/lib/meta-ad-api"

export async function POST(request: NextRequest) {
  try {
    getMetaConfig()
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Missing Meta env in .env.local" },
      { status: 500 }
    )
  }

  try {
    const body = (await request.json()) as {
      name?: string
      dailyBudget?: number
      totalBudget?: number
      totalBudgetCap?: number
      message?: string
      link?: string
    }
    const campaignName = (body.name || "Campaign from Ad Engine").trim()
    const budgetDollars = Math.max(1, Math.min(50, Number(body.dailyBudget) || 5))
    const totalCapRaw = body.totalBudgetCap ?? body.totalBudget
    const totalCap = totalCapRaw != null && totalCapRaw >= 1 ? Math.min(1000, Math.round(Number(totalCapRaw))) : 0
    const budgetCents = totalCap > 0 ? totalCap * 100 : budgetDollars * 100
    const adCopy = (body.message || "Check out our services.").trim()
    const destinationUrl = (body.link || "https://www.uniquepickups.com").trim()
    const { pageId } = getMetaConfig()

    const campaignRes = await createCampaign({
      name: campaignName,
      objective: "OUTCOME_TRAFFIC",
      status: "PAUSED",
    })
    if (campaignRes.error) {
      return NextResponse.json({ error: formatMetaErrorResponse(campaignRes.error), details: campaignRes }, { status: 400 })
    }
    const campaignId = campaignRes.id!

    const useLifetimeBudget = totalCap > 0
    const adSetOpts = {
      name: `${campaignName} - Ad Set`,
      campaignId,
      status: "PAUSED" as const,
      useLifetimeBudget,
      pageId,
      ...(useLifetimeBudget
        ? (() => {
            const start = new Date(Date.now() + 2 * 60 * 1000)
            const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000)
            return {
              lifetimeBudgetCents: Math.max(1000, totalCap * 100),
              startTime: start.toISOString(),
              endTime: end.toISOString(),
            }
          })()
        : { dailyBudgetCents: budgetCents }),
    }
    const adSetRes = await createAdSet(adSetOpts)
    if (adSetRes.error) {
      return NextResponse.json({ error: formatMetaErrorResponse(adSetRes.error), details: adSetRes }, { status: 400 })
    }
    const adSetId = adSetRes.id!

    const objectStorySpec = {
      page_id: pageId,
      link_data: { link: destinationUrl, message: adCopy, name: campaignName },
    }
    const creativeRes = await createCreative({ name: `${campaignName} - Creative`, objectStorySpec })
    if (creativeRes.error) {
      return NextResponse.json({ error: formatMetaErrorResponse(creativeRes.error), details: creativeRes }, { status: 400 })
    }

    const adRes = await createAd({
      name: `${campaignName} - Ad`,
      adsetId: adSetId,
      creativeId: creativeRes.id!,
      status: "PAUSED",
    })
    if (adRes.error) {
      return NextResponse.json({ error: formatMetaErrorResponse(adRes.error), details: adRes }, { status: 400 })
    }

    const message = totalCap > 0
      ? `Campaign created with $${totalCap} max total—Facebook will never spend more than this. Turn it on in Ads Manager when ready.`
      : "Campaign created in PAUSED state. Turn it on in Ads Manager when ready."
    return NextResponse.json({
      success: true,
      campaign_id: campaignId,
      adset_id: adSetId,
      ad_id: adRes.id,
      message,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create campaign" },
      { status: 500 }
    )
  }
}
