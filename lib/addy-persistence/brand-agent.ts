import { ADDY_OWNER } from "@/lib/addy"
import { getSupabase, hasSupabase } from "@/lib/supabase"

export async function appendBrandInsight(
  companyId: string,
  userSnippet: string,
  assistantSnippet: string
): Promise<void> {
  if (!hasSupabase()) return
  try {
    const sb = getSupabase()
    const { data: row } = await sb
      .from("addy_brand_agent_memory")
      .select("insights")
      .eq("company_id", companyId)
      .maybeSingle()

    const insights = [
      ...((row?.insights as string[]) ?? []),
      `${new Date().toISOString().slice(0, 10)}: Q: ${userSnippet} → A: ${assistantSnippet}`,
    ].slice(-50)

    await sb.from("addy_brand_agent_memory").upsert(
      {
        company_id: companyId,
        owner_name: ADDY_OWNER.name,
        insights,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "company_id" }
    )
  } catch (e) {
    console.error("Brand agent memory save failed:", e)
  }
}

export async function logSocialPost(
  companyId: string,
  platform: string,
  externalPostId: string | undefined,
  message: string,
  payload: Record<string, unknown> = {}
): Promise<void> {
  if (!hasSupabase()) return
  try {
    await getSupabase().from("addy_social_posts").insert({
      company_id: companyId,
      platform,
      external_post_id: externalPostId,
      message,
      payload,
    })
  } catch (e) {
    console.error("Social post log failed:", e)
  }
}

export async function logBudgetEvent(
  eventType: string,
  amount: number,
  note: string
): Promise<void> {
  if (!hasSupabase()) return
  try {
    await getSupabase().from("addy_chat_budget_events").insert({
      event_type: eventType,
      amount,
      note,
    })
  } catch (e) {
    console.error("Budget event log failed:", e)
  }
}

export async function saveCreativeAnalysis(
  companyId: string,
  assetId: string,
  profitScore: number,
  analysis: string
): Promise<void> {
  if (!hasSupabase()) return
  try {
    await getSupabase().from("addy_creative_analysis").insert({
      company_id: companyId,
      asset_id: assetId,
      profit_score: profitScore,
      analysis,
    })
  } catch (e) {
    console.error("Creative analysis save failed:", e)
  }
}
