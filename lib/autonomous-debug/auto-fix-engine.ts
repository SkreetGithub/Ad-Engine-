import type { RootCauseType } from "./types"

export class AutoFixEngine {
  async fix(type: RootCauseType): Promise<string | null> {
    switch (type) {
      case "META_API_BUDGET_FLAG":
        return this.fixMetaBudget()
      case "SUPABASE_ENV_MISSING":
        return this.fixEnvConfig()
      case "NETWORK_TIMEOUT":
        return this.fixTimeout()
      case "RATE_LIMIT":
        return this.fixRateLimit()
      default:
        return null
    }
  }

  private fixMetaBudget(): string {
    return `// Patch: Meta is_adset_budget_sharing_enabled compliance
// Ensure createAdSet uses determineBudgetSharing from lib/meta-ad-api.ts
export function determineBudgetSharing({ isScaling, useCampaignBudget }: { isScaling: boolean; useCampaignBudget: boolean }) {
  if (useCampaignBudget) return null;
  return isScaling ? "True" : "False";
}
`
  }

  private fixEnvConfig(): string {
    return `// Patch: Supabase env guard
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error("Missing Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY)");
}
`
  }

  private fixTimeout(): string {
    return `// Patch: Increase request timeout
const DEFAULT_TIMEOUT_MS = 15000;
// Apply to fetch: AbortSignal.timeout(DEFAULT_TIMEOUT_MS) or axios timeout
`
  }

  private fixRateLimit(): string {
    return `// Patch: Rate limit backoff
const rateLimiter = async <T>(fn: () => Promise<T>) => {
  await new Promise(r => setTimeout(r, 500 + Math.random() * 1500));
  return fn();
};
`
  }
}
