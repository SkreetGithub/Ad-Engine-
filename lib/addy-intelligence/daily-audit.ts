import type { Company } from "@/lib/companies/types"
import type { ReviewCycleRecord } from "@/lib/addy-engine/types"
import { getSupabase, hasSupabase } from "@/lib/supabase"
import { loadCumulativeLessons } from "@/lib/addy-persistence"
import { recallSimilarMemories } from "@/lib/addy-intelligence/memory"

export interface DailyAuditBenchmarks {
  portfolioRoas: number
  targetRoas: number
  gapToTarget: number
  spend: number
  profit: number
  dailyBudget: number
  budgetUsedPct: number
  memoryEntries: number
  superLearningSessions: number
  predictionsLast7d: number
  avgPredictedRoi: number
  cronRunsLast7d: number
  lessonsApplied: string[]
  topRecommendations: string[]
}

export interface ConsolidatedDailyAudit {
  companyId: string
  auditDate: string
  decisionBrief: string
  benchmarks: DailyAuditBenchmarks
}

export async function buildConsolidatedDailyAudit(
  company: Company,
  latestCycle: ReviewCycleRecord | null
): Promise<ConsolidatedDailyAudit> {
  const spend = latestCycle?.spend ?? company.currentAdSpend
  const profit = latestCycle?.profit ?? company.currentProfit
  const portfolioRoas =
    latestCycle?.portfolioRatio ??
    (spend > 0 ? profit / spend : company.currentProfitRatio)
  const target = company.targetProfitRatio
  const gapToTarget = target - portfolioRoas
  const budgetUsedPct =
    company.dailyAdBudget > 0 ? Math.min(100, (spend / company.dailyAdBudget) * 100) : 0

  const lessons = await loadCumulativeLessons(company.id, 15)
  const memories = await recallSimilarMemories(company.id, "profit optimization daily review", 8)

  let superLearningSessions = 0
  let predictionsLast7d = 0
  let avgPredictedRoi = 0
  let cronRunsLast7d = 0

  if (hasSupabase()) {
    const sb = getSupabase()
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

    const [superRows, predRows, cronRows] = await Promise.all([
      sb
        .from("addy_super_learning")
        .select("id", { count: "exact", head: true })
        .eq("company_id", company.id)
        .gte("created_at", weekAgo),
      sb
        .from("addy_profit_predictions")
        .select("predicted_roi")
        .eq("company_id", company.id)
        .gte("created_at", weekAgo),
      sb
        .from("addy_cron_runs")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekAgo),
    ])

    superLearningSessions = superRows.count ?? 0
    cronRunsLast7d = cronRows.count ?? 0
    const preds = predRows.data ?? []
    predictionsLast7d = preds.length
    avgPredictedRoi =
      preds.length > 0
        ? preds.reduce((s, p) => s + (p.predicted_roi as number), 0) / preds.length
        : 0
  }

  const topRecommendations = latestCycle?.recommendations?.slice(0, 5) ?? []
  const lessonsApplied = [
    ...lessons.slice(0, 5),
    ...memories.filter((m) => m.impact_score >= 0.6).map((m) => m.memory.slice(0, 120)),
  ].slice(0, 8)

  const benchmarks: DailyAuditBenchmarks = {
    portfolioRoas,
    targetRoas: target,
    gapToTarget,
    spend,
    profit,
    dailyBudget: company.dailyAdBudget,
    budgetUsedPct,
    memoryEntries: memories.length,
    superLearningSessions,
    predictionsLast7d,
    avgPredictedRoi,
    cronRunsLast7d,
    lessonsApplied,
    topRecommendations,
  }

  const statusLine =
    portfolioRoas >= target
      ? "On or above profit target — scale winners cautiously."
      : gapToTarget > 0.5
        ? `Below target by ${(gapToTarget * 100).toFixed(0)}% ROAS — cut losers first.`
        : "Close to target — optimize creatives before raising budget."

  const decisionBrief = [
    `## Daily audit — ${company.name}`,
    `**Date:** ${new Date().toISOString().slice(0, 10)}`,
    ``,
    `### Profit benchmark`,
    `- Portfolio ROAS: **${portfolioRoas.toFixed(2)}:1** (target **${target}:1**)`,
    `- Spend today: **$${spend.toFixed(2)}** / $${company.dailyAdBudget} budget (${budgetUsedPct.toFixed(0)}%)`,
    `- Profit today: **$${profit.toFixed(2)}**`,
    `- ${statusLine}`,
    ``,
    `### Review actions`,
    latestCycle
      ? `- Queue: ${latestCycle.queueCuts} cuts, ${latestCycle.queueKeeps} keeps, ${latestCycle.queuePauses} pauses`
      : "- No review run yet today — run daily review or wait for cron.",
    ``,
    `### Learning stack (7 days)`,
    `- Memory patterns: ${memories.length} high-impact recalls`,
    `- Super Brain sessions: ${superLearningSessions}`,
    `- Profit predictions: ${predictionsLast7d} (avg ${avgPredictedRoi.toFixed(2)}:1)`,
    `- Automated cron runs: ${cronRunsLast7d}`,
    ``,
    topRecommendations.length
      ? `### Do today\n${topRecommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")}`
      : "### Do today\n1. Sync Meta  2. Run daily review  3. Approve queue cuts",
    lessonsApplied.length
      ? `\n### Lessons Addy remembers\n${lessonsApplied.map((l) => `- ${l}`).join("\n")}`
      : "",
  ].join("\n")

  return {
    companyId: company.id,
    auditDate: new Date().toISOString().slice(0, 10),
    decisionBrief,
    benchmarks,
  }
}

export async function persistDailyAudit(
  company: Company,
  latestCycle: ReviewCycleRecord | null
): Promise<ConsolidatedDailyAudit | null> {
  const audit = await buildConsolidatedDailyAudit(company, latestCycle)
  if (!hasSupabase()) return audit

  try {
    const sb = getSupabase()
    await sb.from("addy_daily_audit").upsert(
      {
        company_id: company.id,
        audit_date: audit.auditDate,
        portfolio_roas: audit.benchmarks.portfolioRoas,
        spend: audit.benchmarks.spend,
        profit: audit.benchmarks.profit,
        target_roas: audit.benchmarks.targetRoas,
        budget_used_pct: audit.benchmarks.budgetUsedPct,
        cuts_recommended: latestCycle?.queueCuts ?? 0,
        keeps_recommended: latestCycle?.queueKeeps ?? 0,
        decision_brief: audit.decisionBrief,
        benchmarks: audit.benchmarks,
      },
      { onConflict: "company_id,audit_date" }
    )

    await sb.from("addy_memory_entries").insert({
      company_id: company.id,
      memory: `Daily audit ${audit.auditDate}: ROAS ${audit.benchmarks.portfolioRoas.toFixed(2)}:1, ${audit.benchmarks.topRecommendations[0] || "maintain discipline"}`,
      impact_score: audit.benchmarks.portfolioRoas >= company.targetProfitRatio ? 0.85 : 0.7,
      profit_impact: audit.benchmarks.profit,
      source: "daily_audit",
      applied_at: new Date().toISOString(),
    })
  } catch (e) {
    console.error("Daily audit persist failed:", e)
  }

  return audit
}

export async function loadLatestDailyAudit(
  companyId: string
): Promise<ConsolidatedDailyAudit | null> {
  if (!hasSupabase()) return null
  const { data } = await getSupabase()
    .from("addy_daily_audit")
    .select("*")
    .eq("company_id", companyId)
    .order("audit_date", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) return null

  return {
    companyId,
    auditDate: data.audit_date as string,
    decisionBrief: data.decision_brief as string,
    benchmarks: (data.benchmarks as DailyAuditBenchmarks) ?? {},
  }
}

export async function loadDailyAuditHistory(companyId: string, limit = 7) {
  if (!hasSupabase()) return []
  const { data } = await getSupabase()
    .from("addy_daily_audit")
    .select("audit_date, portfolio_roas, spend, profit, budget_used_pct, decision_brief")
    .eq("company_id", companyId)
    .order("audit_date", { ascending: false })
    .limit(limit)

  return data ?? []
}
