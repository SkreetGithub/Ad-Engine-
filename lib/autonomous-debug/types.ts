export type RootCauseType =
  | "META_API_BUDGET_FLAG"
  | "SUPABASE_ENV_MISSING"
  | "NETWORK_TIMEOUT"
  | "RATE_LIMIT"
  | "UNKNOWN"

export interface DebugCycleResult {
  ok: boolean
  errorsFound: number
  patchesDeployed: number
  rootCauses: { error: string; root: RootCauseType }[]
  error?: string
}
