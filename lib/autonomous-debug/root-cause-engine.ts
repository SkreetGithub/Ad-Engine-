import type { RootCauseType } from "./types"

export class RootCauseEngine {
  infer(errorLine: string): RootCauseType {
    if (errorLine.includes("is_adset_budget_sharing_enabled")) return "META_API_BUDGET_FLAG"
    if (errorLine.includes("SUPABASE_URL") || errorLine.includes("SUPABASE_ANON_KEY")) return "SUPABASE_ENV_MISSING"
    if (errorLine.includes("timeout") || errorLine.includes("ETIMEDOUT") || errorLine.includes("ECONNRESET")) return "NETWORK_TIMEOUT"
    if (errorLine.includes("429") || errorLine.includes("rate limit")) return "RATE_LIMIT"
    return "UNKNOWN"
  }
}
