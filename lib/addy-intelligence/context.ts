import type { Company } from "@/lib/companies/types"
import type { RunningAd } from "@/lib/addy-engine/types"
import { recallSimilarMemories } from "@/lib/addy-intelligence/memory"
import { predictProfit } from "@/lib/addy-intelligence/profit-prediction"
import { fetchCompetitiveIntel } from "@/lib/addy-intelligence/competitive"

export interface IntelligenceContext {
  memoryBlock: string
  predictionBlock: string
  competitiveBlock: string
  prediction: Awaited<ReturnType<typeof predictProfit>> | null
  memoriesUsed: number
}

export async function buildIntelligenceContext(
  company: Company,
  userMessage: string,
  runningAds: RunningAd[],
  opts: { includePrediction?: boolean; includeCompetitive?: boolean } = {}
): Promise<IntelligenceContext> {
  const memories = await recallSimilarMemories(company.id, userMessage, 5)
  const memoryBlock =
    memories.length > 0
      ? `Past wins/lessons for similar questions:\n${memories
          .map(
            (m) =>
              `- ${m.memory} (impact: ${m.impact_score.toFixed(2)}, relevance: ${(m.similarity_score * 100).toFixed(0)}%)`
          )
          .join("\n")}\nReference these when relevant.`
      : ""

  let predictionBlock = ""
  let prediction: IntelligenceContext["prediction"] = null
  const wantsPrediction =
    opts.includePrediction !== false &&
    (/post|ad|creative|boost|publish|image|video|profit|roi/i.test(userMessage) ||
      userMessage.length > 20)

  if (wantsPrediction) {
    prediction = await predictProfit(company, runningAds, userMessage)
    predictionBlock = `Profit prediction: ${prediction.predictedRoi.toFixed(2)}:1 (${(prediction.confidenceScore * 100).toFixed(0)}% confidence). Suggested test budget: $${prediction.suggestedBudget.toFixed(0)}. ${prediction.verdict}`
  }

  let competitiveBlock = ""
  if (opts.includeCompetitive !== false && /competitor|industry|market|trend/i.test(userMessage)) {
    const intel = await fetchCompetitiveIntel(company)
    if (intel.length) {
      competitiveBlock = `Competitive intel:\n${intel.map((n) => `- ${n}`).join("\n")}`
    }
  }

  return {
    memoryBlock,
    predictionBlock,
    competitiveBlock,
    prediction,
    memoriesUsed: memories.length,
  }
}
