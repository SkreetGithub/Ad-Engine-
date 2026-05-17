import { NextRequest, NextResponse } from "next/server"
import { applyQueueToAds } from "@/lib/addy-engine/daily-review"
import { addRunningAd, readEngine, updateQueueItem, writeEngine, getCompanyView } from "@/lib/addy-engine/store"
import type { RunningAd } from "@/lib/addy-engine/types"

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      itemId: string
      status: "approved" | "rejected"
    }
    const item = await updateQueueItem(body.itemId, {
      status: body.status === "approved" ? "executed" : "rejected",
    })
    if (!item) {
      return NextResponse.json({ error: "Queue item not found" }, { status: 404 })
    }

    if (body.status === "approved") {
      const engine = await readEngine()
      if (item.action === "cut" || item.action === "pause") {
        engine.runningAds = applyQueueToAds(
          { ...item, status: "executed" },
          engine.runningAds
        )
      }
      if (item.action === "new_ad" && item.payload) {
        const p = item.payload as { headline?: string; body?: string; basedOn?: string }
        const newAd: Omit<RunningAd, "id" | "createdAt" | "updatedAt"> = {
          companyId: item.companyId,
          name: item.adName || "New ad",
          headline: String(p.headline || "New offer"),
          body: String(p.body || ""),
          cta: "Shop Now",
          targetAudience: "Broad",
          libraryAdId: p.basedOn as string | undefined,
          status: "draft",
          spendToday: 0,
          profitToday: 0,
          profitRatio: 0,
          ctr: 0,
          conversions: 0,
          underperformDays: 0,
        }
        engine.runningAds.push({
          ...newAd,
          id: `ad_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }
      await writeEngine(engine)
    }

    const view = item.companyId ? await getCompanyView(item.companyId) : null
    return NextResponse.json({ item, view })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Queue update failed" },
      { status: 500 }
    )
  }
}
