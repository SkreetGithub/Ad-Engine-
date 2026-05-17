import { NextResponse } from "next/server"
import { runOneDebugCycle } from "@/lib/autonomous-debug"

/**
 * POST /api/debug/run
 *
 * Runs one autonomous debug cycle: scan .data/debug/runtime.log → infer root cause →
 * generate fix → deploy patch to .data/debug/patches/ → log to Supabase debug_memory.
 *
 * Call every 30s–1m via cron (e.g. Vercel Cron, Netlify Scheduled Function) for self-healing.
 */
export async function POST() {
  try {
    const result = await runOneDebugCycle()
    return NextResponse.json(result, result.ok ? 200 : 500)
  } catch (e) {
    return NextResponse.json(
      { ok: false, errorsFound: 0, patchesDeployed: 0, rootCauses: [], error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    )
  }
}

/** GET – same as POST (for cron GET triggers). */
export async function GET() {
  return POST()
}
