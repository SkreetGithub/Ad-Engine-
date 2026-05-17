import { NextResponse } from "next/server"
import { runOneCycle } from "@/lib/ai-business-engine"
import { hasSupabase } from "@/lib/supabase"

/**
 * POST /api/ai-engine/run
 *
 * Runs one full autonomous optimization cycle:
 * Observe → Decide → Act → Measure → Store → Learn → Predict
 *
 * Call from cron every 6h (Vercel Cron, Netlify Scheduled Function, or external).
 * Requires SUPABASE_URL + SUPABASE_ANON_KEY for brain memory; optional for simulation-only.
 */
export async function POST() {
  try {
    const persist = hasSupabase()
    const result = await runOneCycle({ persistToSupabase: persist })
    return NextResponse.json(result, result.ok ? 200 : 500)
  } catch (e) {
    const message = e instanceof Error ? e.message : "AI engine run failed"
    return NextResponse.json(
      { ok: false, error: message, adsProcessed: 0, actions: [], neuralTrained: false },
      { status: 500 }
    )
  }
}

/**
 * GET /api/ai-engine/run – same as POST (for cron GET triggers).
 */
export async function GET() {
  return POST()
}
