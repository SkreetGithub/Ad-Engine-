import { getSupabase, hasSupabase } from "@/lib/supabase"
import { BrainDB } from "@/lib/ai-business-engine/brain-db"

export async function runAutoBoost(
  companyId: string,
  postId: string,
  boostBudget: number,
  socialPostRowId?: string
): Promise<{ ok: boolean; error?: string; campaignId?: string }> {
  const token = process.env.META_ACCESS_TOKEN
  const accountId = process.env.META_AD_ACCOUNT_ID
  if (!token || !accountId) {
    return { ok: false, error: "Meta ads not configured for auto-boost" }
  }

  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const res = await fetch(`${base}/api/facebook/boost`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId,
        name: `Addy auto-boost ${postId.slice(-8)}`,
        dailyBudget: boostBudget,
        totalBudgetCap: boostBudget * 3,
      }),
    })
    const data = (await res.json()) as { error?: string; campaignId?: string }

    if (!res.ok) {
      return { ok: false, error: data.error || "Boost failed" }
    }

    if (hasSupabase() && socialPostRowId) {
      await getSupabase()
        .from("addy_social_posts")
        .update({ boost_status: "boosting" })
        .eq("id", socialPostRowId)
    }

    await BrainDB.storeProfit(-boostBudget)
    if (hasSupabase()) {
      await getSupabase().from("profit_log").insert({
        company_id: companyId,
        profit: 0,
        roi: 0,
        action: "auto_boost",
        cost: boostBudget,
      })
    }

    return { ok: true, campaignId: data.campaignId }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Boost error" }
  }
}
