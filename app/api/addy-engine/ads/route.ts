import { NextRequest, NextResponse } from "next/server"
import { addRunningAd, addLibraryAd } from "@/lib/addy-engine/store"
import { scanAdFields } from "@/lib/addy-engine/policy"
import type { LibraryAd, RunningAd } from "@/lib/addy-engine/types"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const type = body.type as "running" | "library"

    const fields = {
      headline: body.headline as string,
      body: body.body as string,
      cta: body.cta as string,
    }
    const policyFlags = scanAdFields(fields)

    if (type === "library") {
      const ad = await addLibraryAd({
        companyId: body.companyId,
        name: body.name,
        headline: body.headline,
        body: body.body,
        cta: body.cta || "Learn More",
        targetAudience: body.targetAudience || "",
        tags: body.tags || [],
        historicalRoi: body.historicalRoi ?? 0,
        historicalSpend: body.historicalSpend ?? 0,
        creativeAssetId: body.creativeAssetId,
      } as Omit<LibraryAd, "id" | "createdAt" | "updatedAt">)
      return NextResponse.json({ ad, policyFlags }, { status: 201 })
    }

    const spend = Number(body.spendToday) || 0
    const profit = Number(body.profitToday) || 0
    const ad = await addRunningAd({
      companyId: body.companyId,
      name: body.name,
      headline: body.headline,
      body: body.body,
      cta: body.cta || "Shop Now",
      targetAudience: body.targetAudience || "",
      status: body.status || "draft",
      spendToday: spend,
      profitToday: profit,
      profitRatio: spend > 0 ? profit / spend : 0,
      ctr: body.ctr ?? 0,
      conversions: body.conversions ?? 0,
      underperformDays: body.underperformDays ?? 0,
      creativeAssetId: body.creativeAssetId,
      libraryAdId: body.libraryAdId,
    } as Omit<RunningAd, "id" | "createdAt" | "updatedAt">)
    return NextResponse.json({ ad, policyFlags }, { status: 201 })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to add ad" },
      { status: 500 }
    )
  }
}
