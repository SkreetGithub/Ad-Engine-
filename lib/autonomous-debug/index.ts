/**
 * Autonomous Debug AI — self-healing system.
 *
 * Scans runtime logs, infers root cause (Meta budget flag, Supabase env, timeout, rate limit),
 * generates patches, deploys to .data/debug/patches/, logs failures to Supabase debug_memory.
 */

export { runOneDebugCycle } from "./run-cycle"
export { DEBUG_CONFIG } from "./config"
export { ErrorDetector } from "./error-detector"
export { RootCauseEngine } from "./root-cause-engine"
export { AutoFixEngine } from "./auto-fix-engine"
export { PatchEngine } from "./patch-engine"
export { DebugMemory } from "./debug-memory"
export { runtimeLogger } from "./runtime-logger"
export type { DebugCycleResult, RootCauseType } from "./types"
