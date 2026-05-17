import { NextRequest, NextResponse } from "next/server"
import { ensureEngineSeeded, updateSettings } from "@/lib/addy-engine/store"
import type { AddySettings } from "@/lib/addy-engine/types"

export async function GET() {
  const engine = await ensureEngineSeeded()
  return NextResponse.json({ settings: engine.settings })
}

export async function PATCH(request: NextRequest) {
  try {
    const patch = (await request.json()) as Partial<AddySettings>
    const settings = await updateSettings(patch)
    return NextResponse.json({ settings })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Settings update failed" },
      { status: 500 }
    )
  }
}
