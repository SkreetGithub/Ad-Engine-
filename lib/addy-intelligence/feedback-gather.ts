import type { Company } from "@/lib/companies/types"
import { getSupabase, hasSupabase } from "@/lib/supabase"
import { loadCumulativeLessons } from "@/lib/addy-persistence"
import { loadLatestDailyAudit, loadDailyAuditHistory } from "@/lib/addy-intelligence/daily-audit"
import { recallSimilarMemories } from "@/lib/addy-intelligence/memory"

export interface CompanyFeedbackBundle {
  companyId: string
  gatheredAt: string
  narrative: string
  signalCounts: Record<string, number>
}

async function safeQuery<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn()
  } catch {
    return null
  }
}

/** Pull every learning signal Supabase has for this brand before review/audit. */
export async function gatherCompanyFeedback(company: Company): Promise<CompanyFeedbackBundle> {
  const gatheredAt = new Date().toISOString()
  const parts: string[] = []
  const signalCounts: Record<string, number> = {}

  const lessons = await loadCumulativeLessons(company.id, 20)
  signalCounts.lessons = lessons.length
  if (lessons.length) {
    parts.push(`Past lessons (${lessons.length}):\n${lessons.slice(0, 8).map((l) => `- ${l}`).join("\n")}`)
  }

  const memories = await recallSimilarMemories(
    company.id,
    "profit optimization budget cuts winners losers ROAS",
    10
  )
  signalCounts.memories = memories.length
  if (memories.length) {
    parts.push(
      `High-impact memories:\n${memories
        .map((m) => `- ${m.memory} (impact ${m.impact_score.toFixed(2)})`)
        .join("\n")}`
    )
  }

  const latestAudit = await loadLatestDailyAudit(company.id)
  if (latestAudit) {
    signalCounts.audits = 1
    parts.push(`Latest audit (${latestAudit.auditDate}):\n${latestAudit.decisionBrief.slice(0, 800)}`)
  }

  const auditHistory = await loadDailyAuditHistory(company.id, 5)
  signalCounts.auditHistory = auditHistory.length

  if (!hasSupabase()) {
    return {
      companyId: company.id,
      gatheredAt,
      narrative: parts.join("\n\n") || "No Supabase — limited feedback.",
      signalCounts,
    }
  }

  const sb = getSupabase()
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

  const [
    superRows,
    predRows,
    abRows,
    intelRows,
    postRows,
    creativeRows,
    cronRows,
    profitRows,
    brainRows,
    brandMem,
  ] = await Promise.all([
    safeQuery(() =>
      sb
        .from("addy_super_learning")
        .select("question, cursor_answer, used_cursor, created_at")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false })
        .limit(5)
    ),
    safeQuery(() =>
      sb
        .from("addy_profit_predictions")
        .select("predicted_roi, confidence_score, creative_summary, created_at")
        .eq("company_id", company.id)
        .gte("created_at", weekAgo)
        .order("created_at", { ascending: false })
        .limit(10)
    ),
    safeQuery(() =>
      sb
        .from("addy_ab_tests")
        .select("test_name, status, winner, roi_a, roi_b")
        .eq("company_id", company.id)
        .in("status", ["running", "completed"])
        .limit(5)
    ),
    safeQuery(() =>
      sb
        .from("addy_competitive_intel")
        .select("competitor_name, addy_notes, ad_copy")
        .eq("company_id", company.id)
        .order("detected_at", { ascending: false })
        .limit(5)
    ),
    safeQuery(() =>
      sb
        .from("addy_social_posts")
        .select("platform, boost_status, auto_boost, message")
        .eq("company_id", company.id)
        .gte("created_at", weekAgo)
        .limit(8)
    ),
    safeQuery(() =>
      sb
        .from("addy_creative_analysis")
        .select("profit_score, analysis")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false })
        .limit(5)
    ),
    safeQuery(() =>
      sb
        .from("addy_cron_runs")
        .select("status, summary, created_at")
        .order("created_at", { ascending: false })
        .limit(5)
    ),
    safeQuery(() =>
      sb
        .from("profit_log")
        .select("profit, roi, action")
        .eq("company_id", company.id)
        .gte("created_at", weekAgo)
        .order("created_at", { ascending: false })
        .limit(10)
    ),
    safeQuery(() =>
      sb
        .from("brain_memory")
        .select("action, reward, created_at")
        .order("created_at", { ascending: false })
        .limit(5)
    ),
    safeQuery(() =>
      sb
        .from("addy_brand_agent_memory")
        .select("insights, super_learning_count")
        .eq("company_id", company.id)
        .maybeSingle()
    ),
  ])

  const superData = superRows?.data ?? []
  signalCounts.superLearning = superData.length
  if (superData.length) {
    parts.push(
      `Super Brain (${superData.length} recent):\n${superData
        .map(
          (r) =>
            `- Q: ${String(r.question).slice(0, 80)}… → ${String(r.cursor_answer).slice(0, 120)}…`
        )
        .join("\n")}`
    )
  }

  const preds = predRows?.data ?? []
  signalCounts.predictions = preds.length
  if (preds.length) {
    const avg =
      preds.reduce((s, p) => s + (p.predicted_roi as number), 0) / preds.length
    parts.push(
      `Profit predictions (7d, n=${preds.length}, avg ${avg.toFixed(2)}:1):\n${preds
        .slice(0, 5)
        .map(
          (p) =>
            `- ${(p.predicted_roi as number).toFixed(2)}:1 @ ${((p.confidence_score as number) * 100).toFixed(0)}% — ${p.creative_summary || "creative"}`
        )
        .join("\n")}`
    )
  }

  const abData = abRows?.data ?? []
  signalCounts.abTests = abData.length
  if (abData.length) {
    parts.push(
      `A/B tests:\n${abData
        .map(
          (t) =>
            `- ${t.test_name}: ${t.status}${t.winner ? ` winner=${t.winner}` : ""} (A ${t.roi_a}:1 vs B ${t.roi_b}:1)`
        )
        .join("\n")}`
    )
  }

  const intel = intelRows?.data ?? []
  signalCounts.competitive = intel.length
  if (intel.length) {
    parts.push(
      `Competitive intel:\n${intel.map((i) => `- ${i.competitor_name}: ${i.addy_notes || i.ad_copy || "tracked"}`).join("\n")}`
    )
  }

  const posts = postRows?.data ?? []
  signalCounts.socialPosts = posts.length
  if (posts.length) {
    parts.push(
      `Social / boosts:\n${posts
        .map(
          (p) =>
            `- ${p.platform}: boost=${p.auto_boost ? p.boost_status : "organic"} — ${String(p.message || "").slice(0, 60)}`
        )
        .join("\n")}`
    )
  }

  const creatives = creativeRows?.data ?? []
  signalCounts.creativeAnalysis = creatives.length
  if (creatives.length) {
    parts.push(
      `Creative scores:\n${creatives
        .map((c) => `- score ${c.profit_score}: ${String(c.analysis).slice(0, 100)}`)
        .join("\n")}`
    )
  }

  const crons = cronRows?.data ?? []
  signalCounts.cronRuns = crons.length
  if (crons.length) {
    parts.push(
      `Cron health:\n${crons.map((c) => `- ${c.created_at}: ${c.status} — ${c.summary || "ok"}`).join("\n")}`
    )
  }

  const profits = profitRows?.data ?? []
  signalCounts.profitLog = profits.length
  if (profits.length) {
    const total = profits.reduce((s, p) => s + (p.profit as number), 0)
    parts.push(`Profit log (7d): $${total.toFixed(2)} across ${profits.length} events`)
  }

  const brain = brainRows?.data ?? []
  signalCounts.brainMemory = brain.length
  if (brain.length) {
    parts.push(
      `RL brain:\n${brain.map((b) => `- ${b.action}: reward ${b.reward}`).join("\n")}`
    )
  }

  const insights = (brandMem?.data?.insights as string[] | undefined) ?? []
  signalCounts.brandInsights = insights.length
  if (insights.length) {
    parts.push(`Brand agent insights:\n${insights.slice(0, 5).map((i) => `- ${i}`).join("\n")}`)
  }

  if (auditHistory.length > 1) {
    parts.push(
      `Audit trend (last ${auditHistory.length} days):\n${auditHistory
        .map(
          (a) =>
            `- ${a.audit_date}: ROAS ${(a.portfolio_roas as number).toFixed(2)}:1, spend $${(a.spend as number).toFixed(0)}, profit $${(a.profit as number).toFixed(0)}`
        )
        .join("\n")}`
    )
  }

  const narrative =
    parts.length > 0
      ? parts.join("\n\n")
      : `No historical signals yet for ${company.name}. Cron will seed memory after first review.`

  return { companyId: company.id, gatheredAt, narrative, signalCounts }
}

/** Store consolidated cron feedback so chat and next review recall it. */
export async function persistFeedbackSnapshot(
  company: Company,
  bundle: CompanyFeedbackBundle
): Promise<void> {
  if (!hasSupabase()) return

  const totalSignals = Object.values(bundle.signalCounts).reduce((a, b) => a + b, 0)
  const summary = `Cron feedback gather (${bundle.gatheredAt.slice(0, 10)}): ${totalSignals} signals — ${Object.entries(
    bundle.signalCounts
  )
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `${k}:${n}`)
    .join(", ")}`

  try {
    await getSupabase().from("addy_memory_entries").insert({
      company_id: company.id,
      memory: `${summary}\n\n${bundle.narrative.slice(0, 3500)}`,
      impact_score: Math.min(0.95, 0.5 + totalSignals * 0.03),
      profit_impact: company.currentProfit,
      source: "cron_feedback",
      applied_at: bundle.gatheredAt,
    })
  } catch (e) {
    console.error("Feedback snapshot persist failed:", e)
  }
}
