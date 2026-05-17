import { NextRequest, NextResponse } from "next/server"
import { readStore } from "@/lib/analytics-store"

export async function GET(request: NextRequest) {
  try {
    const store = await readStore()
    const daysParam = request.nextUrl?.searchParams?.get("days")
    const days = Math.min(31, Math.max(1, parseInt(daysParam || "7", 10) || 7))

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    const cutoffStr = cutoff.toISOString().slice(0, 10)

    const rows = Array.isArray(store.rows) ? store.rows.filter((r) => r.date >= cutoffStr) : []
    return NextResponse.json({
      lastSync: store.lastSync || "",
      rows,
      summary: summarize(rows),
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load analytics"
    return NextResponse.json({ error: message, lastSync: "", rows: [], summary: { spend: 0, impressions: 0, clicks: 0 } }, { status: 500 })
  }
}

function summarize(rows: { spend: number; impressions: number; clicks: number }[]) {
  return rows.reduce(
    (acc, r) => ({
      spend: acc.spend + r.spend,
      impressions: acc.impressions + r.impressions,
      clicks: acc.clicks + r.clicks,
    }),
    { spend: 0, impressions: 0, clicks: 0 }
  )
}
