import { NextResponse } from "next/server"
import { runAddyOptimization } from "@/lib/addy-engine/run-optimization"
import { getCronSource, verifyCronAuth } from "@/lib/security/api-guard"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/** Legacy path — prefer /api/cron/optimize-ads for GitHub Actions */
export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await runAddyOptimization({ source: getCronSource(request) })

  if (result.locked) {
    return NextResponse.json({ ok: false, message: result.summary }, { status: 409 })
  }

  if (!result.ok) {
    return NextResponse.json({ error: result.summary }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    summary: result.summary,
    processed: result.processed,
    details: result.details,
  })
}
