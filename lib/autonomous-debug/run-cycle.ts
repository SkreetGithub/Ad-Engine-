import { ErrorDetector } from "./error-detector"
import { RootCauseEngine } from "./root-cause-engine"
import { AutoFixEngine } from "./auto-fix-engine"
import { PatchEngine } from "./patch-engine"
import { DebugMemory } from "./debug-memory"
import type { DebugCycleResult, RootCauseType } from "./types"

const detector = new ErrorDetector()
const causeEngine = new RootCauseEngine()
const fixEngine = new AutoFixEngine()
const patchEngine = new PatchEngine()

/**
 * Run one autonomous debug cycle: scan logs → infer root cause → generate fix → deploy patch → log to Supabase.
 * Call from POST /api/debug/run or cron every 30s–1m.
 */
export async function runOneDebugCycle(): Promise<DebugCycleResult> {
  const rootCauses: { error: string; root: RootCauseType }[] = []
  let patchesDeployed = 0

  try {
    const errors = await detector.scanLogs()

    for (const err of errors) {
      const root = causeEngine.infer(err)
      rootCauses.push({ error: err.slice(0, 200), root })

      const patch = await fixEngine.fix(root)
      if (patch) {
        await patchEngine.deploy(patch)
        patchesDeployed++
        await DebugMemory.logFailure(err, { root })
      }
    }

    return {
      ok: true,
      errorsFound: errors.length,
      patchesDeployed,
      rootCauses,
    }
  } catch (e) {
    return {
      ok: false,
      errorsFound: rootCauses.length,
      patchesDeployed,
      rootCauses,
      error: e instanceof Error ? e.message : String(e),
    }
  }
}
