import { NextRequest, NextResponse } from "next/server"
import {
  getMetaConfig,
  createCampaign,
  createAdSet,
  createCreative,
  createAd,
  formatMetaError,
} from "@/lib/meta-ad-api"

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

const strategies = [
  "Flash Sale Urgency",
  "Social Proof / Testimonial",
  "Product Demo Showcase",
  "Behind the Scenes",
  "User-Generated Content Style",
]

function pickStrategy() {
  return strategies[Math.floor(Math.random() * strategies.length)]
}

async function generateCopy(theme: string, strategy: string): Promise<string> {
  if (!OPENAI_API_KEY) return "Move with confidence. Book your pickup today."
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Write one short sentence of ad copy for a logistics/pickup business. Theme: ${theme}. Style: ${strategy}. Under 100 characters. No quotes.`,
        },
      ],
      max_tokens: 80,
    }),
  })
  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content?.trim()
  const copy = raw && raw.length > 0 ? raw : "Book your pickup today. Fast, verified drivers."
  return copy.slice(0, 125)
}

export async function POST(request: NextRequest) {
  try {
    getMetaConfig()
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Missing Meta env vars in .env.local" },
      { status: 500 }
    )
  }

  const host = request.headers.get("host") || request.headers.get("x-forwarded-host")
  const origin = host
    ? (host.startsWith("localhost") ? `http://${host}` : `https://${host}`)
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3550"

  try {
    const listRes = await fetch(`${origin}/api/facebook/campaigns`, { cache: "no-store" })
    const listData = await listRes.json()
    const campaigns = listData.campaigns || []
    const active = campaigns.filter(
      (c: { effective_status?: string; status?: string }) =>
        (c.effective_status || c.status || "").toUpperCase() === "ACTIVE"
    )
    let pausedId: string | null = null
    if (active.length > 0) {
      const toPause = active[0]
      const pauseRes = await fetch(`${origin}/api/facebook/campaign/${toPause.id}/pause`, {
        method: "POST",
        cache: "no-store",
      })
      if (pauseRes.ok) pausedId = toPause.id
    }

    let body: { totalBudgetCap?: number; autoStart?: boolean } = {}
    try {
      body = (await request.json()) as { totalBudgetCap?: number; autoStart?: boolean }
    } catch {
      body = {}
    }
    const totalCap = body.totalBudgetCap != null && body.totalBudgetCap >= 1
      ? Math.min(1000, Math.round(body.totalBudgetCap))
      : 50
    const autoStart = body.autoStart === true
    const status = autoStart ? "ACTIVE" : "PAUSED"
    const strategy = pickStrategy()
    const theme = `Unique Pickups - ${strategy} test`
    const copy = await generateCopy(theme, strategy)
    const name = `Auto ${strategy.replace(/\s+/g, "-").slice(0, 20)} ${new Date().toISOString().slice(0, 10)}`
    const { pageId } = getMetaConfig()

    const campaignRes = await createCampaign({ name, objective: "OUTCOME_TRAFFIC", status })
    if (campaignRes.error) {
      return NextResponse.json({
        rotated: false,
        paused_id: pausedId,
        error: formatMetaError(campaignRes.error),
      }, { status: 400 })
    }
    const campaignId = campaignRes.id!

    const start = new Date(Date.now() + 2 * 60 * 1000)
    const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000)
    const adSetRes = await createAdSet({
      name: `${name} - Ad Set`,
      campaignId,
      status,
      useLifetimeBudget: true,
      pageId,
      lifetimeBudgetCents: Math.max(1000, Math.round(totalCap) * 100),
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    })
    if (adSetRes.error) {
      return NextResponse.json({
        rotated: true,
        paused_id: pausedId,
        campaign_id: campaignId,
        error: "Campaign created but ad set failed: " + formatMetaError(adSetRes.error),
      }, { status: 400 })
    }
    const adSetId = adSetRes.id!

    const objectStorySpec = {
      page_id: pageId,
      link_data: { link: "https://www.uniquepickups.com", message: copy, name },
    }
    const creativeRes = await createCreative({ name: `${name} - Creative`, objectStorySpec })
    if (creativeRes.error) {
      return NextResponse.json({
        rotated: true,
        paused_id: pausedId,
        campaign_id: campaignId,
        error: "Ad set created but creative failed: " + formatMetaError(creativeRes.error),
      }, { status: 400 })
    }

    const adRes = await createAd({
      name: `${name} - Ad`,
      adsetId: adSetId,
      creativeId: creativeRes.id!,
      status,
    })
    if (adRes.error) {
      return NextResponse.json({
        rotated: true,
        paused_id: pausedId,
        campaign_id: campaignId,
        error: "Creative created but ad failed: " + formatMetaError(adRes.error),
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      rotated: true,
      paused_campaign_id: pausedId,
      new_campaign_id: campaignId,
      new_campaign_name: name,
      new_copy: copy,
      strategy,
      message: autoStart
        ? (pausedId ? `Paused 1 campaign and created new campaign "${name}" (ACTIVE — running now).` : `Created new campaign "${name}" (ACTIVE — running now).`)
        : (pausedId ? `Paused 1 campaign and created new campaign "${name}" (PAUSED). Turn it on in Ads Manager to test.` : `Created new campaign "${name}" (PAUSED). Turn it on in Ads Manager to test.`),
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Automation failed", rotated: false },
      { status: 500 }
    )
  }
}
