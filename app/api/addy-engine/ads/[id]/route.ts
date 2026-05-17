import { NextRequest, NextResponse } from "next/server"
import { updateRunningAd } from "@/lib/addy-engine/store"

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, context: Ctx) {
  const { id } = await context.params
  try {
    const patch = await request.json()
    const ad = await updateRunningAd(id, patch)
    if (!ad) return NextResponse.json({ error: "Ad not found" }, { status: 404 })
    return NextResponse.json({ ad })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 500 }
    )
  }
}
