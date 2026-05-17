import { NextRequest, NextResponse } from "next/server"
import {
  getMetaConfig,
  createCampaign,
  createAdSet,
  createCreativeFromPost,
  createAd,
  formatMetaErrorResponse,
} from "@/lib/meta-ad-api"

export async function POST(request: NextRequest) {
  try {
    getMetaConfig()
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Missing META_* in .env.local" },
      { status: 500 }
    )
  }

  try {
    const body = (await request.json()) as {
      postId: string
      name?: string
      dailyBudget?: number
      totalBudgetCap?: number
    }
    const id = (body.postId || "").trim()
    if (!id) {
      return NextResponse.json({ error: "postId is required (e.g. from POST /api/facebook/post response)" }, { status: 400 })
    }

    const campaignName = (body.name || `Boost ${id.slice(-8)}`).trim()
    const totalCapRaw = body.totalBudgetCap
    const totalCap = totalCapRaw != null && totalCapRaw >= 1 ? Math.min(1000, Math.round(Number(totalCapRaw))) : 0
    const dailyCents = Math.max(100, Math.min(5000, (body.dailyBudget || 5) * 100))
    const budgetCents = totalCap > 0 ? totalCap * 100 : dailyCents
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
    const adSetOpts: Parameters<typeof createAdSet>[0] = {
      name: `${campaignName} - Ad Set`,
      campaignId,
      status: "PAUSED",
      useLifetimeBudget,
      pageId,
    }
    if (useLifetimeBudget) {
      const start = new Date(Date.now() + 2 * 60 * 1000)
      const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000)
      adSetOpts.lifetimeBudgetCents = Math.max(1000, budgetCents)
      adSetOpts.startTime = start.toISOString()
      adSetOpts.endTime = end.toISOString()
    } else {
      adSetOpts.dailyBudgetCents = budgetCents
    }

    const adSetRes = await createAdSet(adSetOpts)
    if (adSetRes.error) {
      return NextResponse.json({ error: formatMetaErrorResponse(adSetRes.error), details: adSetRes }, { status: 400 })
    }
    const adSetId = adSetRes.id!

    const creativeRes = await createCreativeFromPost({
      name: `${campaignName} - Creative`,
      objectStoryId: id,
    })
    if (creativeRes.error) {
      return NextResponse.json({
        error: formatMetaErrorResponse(creativeRes.error) + " (check postId is from your Page)",
        details: creativeRes,
      }, { status: 400 })
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

    return NextResponse.json({
      success: true,
      campaign_id: campaignId,
      adset_id: adSetId,
      ad_id: adRes.id,
      post_id: id,
      message: "Boost campaign created in PAUSED state. Turn it on in Ads Manager to run.",
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Boost failed" },
      { status: 500 }
    )
  }
}
