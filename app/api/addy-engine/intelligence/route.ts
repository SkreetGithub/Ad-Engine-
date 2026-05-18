import { NextResponse } from "next/server"
import { getCompany } from "@/lib/companies-store"
import { ensureEngineSeeded } from "@/lib/addy-engine/store"
import { evaluateRunningAbTests } from "@/lib/addy-intelligence/ab-tests"
import { loadLatestDailyAudit, loadDailyAuditHistory } from "@/lib/addy-intelligence/daily-audit"
import { getSupabase, hasSupabase } from "@/lib/supabase"
import { assertValidCompanyId, checkRateLimit, verifyAddyApiSecret } from "@/lib/security/api-guard"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  if (!verifyAddyApiSecret(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const rate = checkRateLimit(request, { max: 60, windowMs: 60_000, key: "intel" })
  if (!rate.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  let companyId: string
  try {
    companyId = assertValidCompanyId(searchParams.get("companyId"))
  } catch {
    return NextResponse.json({ error: "Invalid companyId" }, { status: 400 })
  }

  const company = await getCompany(companyId)
  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 })
  }

  await ensureEngineSeeded()
  const abMessages = await evaluateRunningAbTests(companyId)

  if (!hasSupabase()) {
    return NextResponse.json({
      companyId,
      memoryRecallRate: 0,
      predictionCount: 0,
      avgPredictedRoi: 0,
      autoBoostPosts: 0,
      abTestsCompleted: 0,
      competitorAlerts: 0,
      abMessages,
    })
  }

  const sb = getSupabase()

  const dailyAudit = await loadLatestDailyAudit(companyId)
  const auditHistory = await loadDailyAuditHistory(companyId, 7)

  const [memories, predictions, boosts, intel, abDone, superLearn] = await Promise.all([
    sb.from("addy_memory_entries").select("id", { count: "exact", head: true }).eq("company_id", companyId),
    sb
      .from("addy_profit_predictions")
      .select("predicted_roi, confidence_score")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(50),
    sb
      .from("addy_social_posts")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("auto_boost", true),
    sb
      .from("addy_competitive_intel")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId),
    sb
      .from("addy_ab_tests")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("status", "completed"),
    sb
      .from("addy_super_learning")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId),
  ])

  const preds = predictions.data ?? []
  const avgPredictedRoi =
    preds.length > 0
      ? preds.reduce((s, p) => s + (p.predicted_roi as number), 0) / preds.length
      : 0

  const calibrated = preds.filter((p) => p.confidence_score >= 0.7).length

  return NextResponse.json({
    companyId,
    memoryEntries: memories.count ?? 0,
    memoryRecallRate: Math.min(100, ((memories.count ?? 0) / 20) * 100),
    predictionCount: preds.length,
    avgPredictedRoi,
    highConfidencePredictions: calibrated,
    autoBoostPosts: boosts.count ?? 0,
    abTestsCompleted: abDone.count ?? 0,
    competitorAlerts: intel.count ?? 0,
    superLearningSessions: superLearn.count ?? 0,
    dailyAudit,
    auditHistory,
    abMessages,
  })
}
