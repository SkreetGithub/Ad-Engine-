import { getSupabase, hasSupabase } from "@/lib/supabase"

export async function storeSuperLearning(
  companyId: string,
  question: string,
  answer: string,
  opts: { usedCursor: boolean; agentUrl?: string }
): Promise<void> {
  if (!hasSupabase()) return
  try {
    const sb = getSupabase()
    await sb.from("addy_super_learning").insert({
      company_id: companyId,
      question: question.slice(0, 1000),
      cursor_answer: answer.slice(0, 8000),
      used_cursor: opts.usedCursor,
      agent_url: opts.agentUrl ?? null,
    })

    const { data: row } = await sb
      .from("addy_brand_agent_memory")
      .select("insights, super_learning_count")
      .eq("company_id", companyId)
      .maybeSingle()

    await sb.from("addy_brand_agent_memory").upsert(
      {
        company_id: companyId,
        owner_name: "Demetrius",
        insights: row?.insights ?? [],
        super_learning_count: ((row?.super_learning_count as number) ?? 0) + 1,
        last_cursor_sync: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "company_id" }
    )
  } catch (e) {
    console.error("Super learning save failed:", e)
  }
}
