import { NextResponse } from "next/server"
import { mergeInsights, type AnalyticsRow } from "@/lib/analytics-store"

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN
const META_AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID
const graphUrl = "https://graph.facebook.com/v21.0"

export async function GET() {
  if (!META_ACCESS_TOKEN || !META_AD_ACCOUNT_ID) {
    return NextResponse.json(
      { error: "Missing META_ACCESS_TOKEN or META_AD_ACCOUNT_ID" },
      { status: 500 }
    )
  }

  try {
    const params = new URLSearchParams({
      access_token: META_ACCESS_TOKEN,
      level: "campaign",
      fields: "campaign_id,campaign_name,spend,impressions,clicks",
      date_preset: "last_7d",
      time_increment: "1",
    })
    const res = await fetch(
      `${graphUrl}/${META_AD_ACCOUNT_ID}/insights?${params.toString()}`
    )
    const raw = await res.text()
    let data: { error?: { message?: string }; data?: unknown[] }
    try {
      data = raw.startsWith("{") ? JSON.parse(raw) : {}
    } catch {
      return NextResponse.json(
        {
          error: "Meta API returned a non-JSON response. Your token may be expired or invalid, or the request was blocked. Try regenerating your access token in Graph API Explorer.",
          details: raw.slice(0, 200),
        },
        { status: 400 }
      )
    }
    if (!data || typeof data !== "object") {
      return NextResponse.json(
        { error: "Invalid response from Meta API.", details: raw.slice(0, 200) },
        { status: 400 }
      )
    }

    if (data.error) {
      return NextResponse.json(
        { error: data.error.message || "Meta Insights API error", details: data },
        { status: 400 }
      )
    }

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

    const store = await mergeInsights(rows)
    return NextResponse.json({
      success: true,
      lastSync: store.lastSync,
      rowsAdded: rows.length,
      totalRows: store.rows.length,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sync failed" },
      { status: 500 }
    )
  }
}

export async function POST() {
  return GET()
}
