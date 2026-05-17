import { getSupabase } from "@/lib/supabase"
import { hasSupabase } from "@/lib/supabase"
import type { RootCauseType } from "./types"

export const DebugMemory = {
  async logFailure(error: string, context: { root?: RootCauseType; [key: string]: unknown }): Promise<void> {
    if (!hasSupabase()) return
    await getSupabase().from("debug_memory").insert([
      { error, context: context as object, root_cause: context.root ?? "UNKNOWN" },
    ])
  },

  async fetchSimilarErrors(signature: string): Promise<{ error: string; context: unknown }[]> {
    if (!hasSupabase()) return []
    const { data } = await getSupabase()
      .from("debug_memory")
      .select("error, context")
      .ilike("error", `%${signature.replace(/%/g, "\\%")}%`)
      .limit(20)
    return (data ?? []) as { error: string; context: unknown }[]
  },
}
