import { NextResponse } from "next/server"
import { runAddyOptimization } from "@/lib/addy-engine/run-optimization"
import { getCronSource, verifyCronAuth } from "@/lib/security/api-guard"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/** GitHub Actions, Supabase pg_cron, or Vercel cron — Bearer CRON_SECRET required in production */
export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const source = getCronSource(request)
  const lightweight = request.headers.get("x-github-runner") === "true"

  const result = await runAddyOptimization({ source, lightweight })

  if (result.locked) {
    return NextResponse.json(
      { ok: false, message: result.summary, source },
      { status: 409 }
    )
  }

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.summary, processed: result.processed, details: result.details },
      { status: 500 }
    )
  }

  if (lightweight) {
    return NextResponse.json({
      ok: true,
      brandsProcessed: result.processed,
      summary: result.summary,
      timestamp: new Date().toISOString(),
      source,
    })
  }

  return NextResponse.json({
    ok: true,
    summary: result.summary,
    processed: result.processed,
    details: result.details,
    source,
  })
}
