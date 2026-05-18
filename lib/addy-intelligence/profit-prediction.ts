import type { Company } from "@/lib/companies/types"
import type { RunningAd } from "@/lib/addy-engine/types"
import { getSupabase, hasSupabase } from "@/lib/supabase"

export interface ProfitPrediction {
  predictedRoi: number
  confidenceScore: number
  suggestedBudget: number
  verdict: string
}

export async function predictProfit(
  company: Company,
  runningAds: RunningAd[],
  creativeHint?: string
): Promise<ProfitPrediction> {
  const active = runningAds.filter((a) => a.status === "active" && a.spendToday > 0)
  let samples: { roi: number }[] = active.map((a) => ({
    roi: a.profitRatio > 0 ? a.profitRatio : 0,
  }))

  if (hasSupabase()) {
    const sb = getSupabase()
    const { data: logs } = await sb
      .from("profit_log")
      .select("roi, profit")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false })
      .limit(30)

    if (logs?.length) {
      samples = logs.map((l) => ({
        roi: (l.roi as number) ?? ((l.profit as number) > 0 ? 2.5 : 1.2),
      }))
    }

    const { data: preds } = await sb
      .from("addy_profit_predictions")
      .select("predicted_roi, actual_roi")
      .eq("company_id", company.id)
      .not("actual_roi", "is", null)
      .limit(20)

    if (preds?.length) {
      const calibration =
        preds.reduce((s, p) => s + ((p.actual_roi as number) / (p.predicted_roi as number || 1)), 0) /
        preds.length
      if (calibration > 0.5 && calibration < 2) {
        samples = samples.map((s) => ({ roi: s.roi * calibration }))
      }
    }
  }

  const n = Math.max(samples.length, 1)
  const avgRoi = samples.reduce((s, x) => s + x.roi, 0) / n
  const confidence = Math.min(0.95, Math.max(0.35, n / 12))
  const target = company.targetProfitRatio
  const predictedRoi = creativeHint?.toLowerCase().includes("ugc")
    ? avgRoi * 1.08
    : avgRoi

  const suggestedBudget = Math.min(
    company.dailyAdBudget * 0.3,
    Math.max(5, company.dailyAdBudget * (predictedRoi / target) * 0.1)
  )

  let verdict = "Neutral — test with small budget"
  if (predictedRoi >= target) verdict = "Likely profitable — scale carefully"
  else if (predictedRoi < company.autoCutThreshold) verdict = "Below cut threshold — revise creative"

  if (hasSupabase() && creativeHint) {
    await getSupabase().from("addy_profit_predictions").insert({
      company_id: company.id,
      creative_summary: creativeHint.slice(0, 300),
      predicted_roi: predictedRoi,
      confidence_score: confidence,
      suggested_budget: suggestedBudget,
    })
  }

  return {
    predictedRoi,
    confidenceScore: confidence,
    suggestedBudget,
    verdict,
  }
}
