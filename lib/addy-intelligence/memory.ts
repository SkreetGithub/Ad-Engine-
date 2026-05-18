import { getSupabase, hasSupabase } from "@/lib/supabase"

export interface RecalledMemory {
  memory: string
  impact_score: number
  similarity_score: number
}

export async function recallSimilarMemories(
  companyId: string,
  question: string,
  limit = 5
): Promise<RecalledMemory[]> {
  if (!hasSupabase()) return []

  const sb = getSupabase()
  const { data, error } = await sb.rpc("recall_similar_situations", {
    p_company_id: companyId,
    p_question: question.slice(0, 500),
    p_limit: limit,
  })

  if (!error && data?.length) {
    return data as RecalledMemory[]
  }

  const { data: rows } = await sb
    .from("addy_memory_entries")
    .select("memory, impact_score")
    .eq("company_id", companyId)
    .gte("impact_score", 0.5)
    .order("impact_score", { ascending: false })
    .limit(limit)

  const q = question.toLowerCase()
  return (rows ?? [])
    .map((r) => ({
      memory: r.memory as string,
      impact_score: r.impact_score as number,
      similarity_score: q.split(" ").some((w) => w.length > 3 && (r.memory as string).toLowerCase().includes(w))
        ? 0.6
        : 0.3,
    }))
    .filter((r) => r.similarity_score > 0.35)
}

export async function storeMemoryEntry(
  companyId: string,
  memory: string,
  opts: {
    impactScore?: number
    profitImpact?: number
    source?: string
  } = {}
): Promise<void> {
  if (!hasSupabase()) return
  const sb = getSupabase()
  await sb.from("addy_memory_entries").insert({
    company_id: companyId,
    memory: memory.slice(0, 2000),
    impact_score: opts.impactScore ?? 0.5,
    profit_impact: opts.profitImpact ?? 0,
    source: opts.source ?? "chat",
  })

  await sb.from("addy_brand_agent_memory").upsert(
    {
      company_id: companyId,
      owner_name: "Demetrius",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "company_id" }
  )
}

export async function boostMemoryImpact(
  companyId: string,
  memorySnippet: string,
  profitImpact: number
): Promise<void> {
  if (!hasSupabase()) return
  const sb = getSupabase()
  const { data } = await sb
    .from("addy_memory_entries")
    .select("id, impact_score")
    .eq("company_id", companyId)
    .ilike("memory", `%${memorySnippet.slice(0, 40)}%`)
    .order("created_at", { ascending: false })
    .limit(1)

  if (data?.[0]) {
    await sb
      .from("addy_memory_entries")
      .update({
        impact_score: Math.min(1, (data[0].impact_score as number) + 0.15),
        profit_impact: profitImpact,
        applied_at: new Date().toISOString(),
      })
      .eq("id", data[0].id)
  }
}
