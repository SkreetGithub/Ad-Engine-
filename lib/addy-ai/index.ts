import { ADDY, ADDY_OWNER } from "@/lib/addy"
import type { Company } from "@/lib/companies/types"
import type { AddySettings, BrandingAsset, LibraryAd, RunningAd } from "@/lib/addy-engine/types"
import { parsePendingAction } from "@/lib/addy-ai/chat-actions"
import {
  resetOpenAiBudgetIfNewDay,
  resolveDefaultAiMode,
} from "@/lib/addy-ai/config"
import { getOllamaResponse } from "@/lib/addy-ai/ollama"
import { getOpenAIResponse } from "@/lib/addy-ai/openai"
import { loadCumulativeLessons } from "@/lib/addy-persistence"
import { appendBrandInsight } from "@/lib/addy-persistence/brand-agent"

export function buildAddyContext(
  company: Company,
  adsRunning: RunningAd[],
  adLibrary: LibraryAd[],
  assets: BrandingAsset[],
  pendingQueue: number,
  pastLessons: string[] = []
): string {
  const active = adsRunning.filter((a) => a.status === "active")
  return [
    `Boss: ${ADDY_OWNER.name} (${ADDY_OWNER.title})`,
    `Addy's mission: ${ADDY.mission}`,
    `Brand agent for: ${company.name} (${company.industry})`,
    `Target profit ratio: ${company.targetProfitRatio}:1`,
    `Auto-cut threshold: ${company.autoCutThreshold}:1`,
    `CX goal: ${company.customerExperienceGoal} — ${company.customerExperienceNotes}`,
    `Daily ad budget: $${company.dailyAdBudget}, spend today: $${company.currentAdSpend}, profit today: $${company.currentProfit}`,
    `Strategy: ${company.adStrategyPlan || "(set in workspace)"}`,
    `Autonomous mode: ${company.autonomousMode ? "ON" : "OFF — Demetrius approves cuts"}`,
    `Running ads (${active.length}): ${active.map((a) => `${a.name} ROI ${a.profitRatio.toFixed(2)}:1 spend $${a.spendToday}`).join("; ") || "none — sync Meta or add ads"}`,
    `Library: ${adLibrary.length} ads, ${adLibrary.filter((a) => a.tags.includes("winning")).length} winning`,
    `Uploaded creatives: ${assets.map((a) => `${a.name} (${a.type})`).join(", ") || "none"}`,
    `Pending review queue: ${pendingQueue}`,
    pastLessons.length
      ? `Lessons from past reviews: ${pastLessons.slice(0, 8).join(" · ")}`
      : "Lessons: run first daily review to start learning.",
  ].join("\n")
}

export interface AddyResponseResult {
  content: string
  mode: AddySettings["aiMode"]
  cost: number
  settingsPatch?: Partial<AddySettings>
  budgetExceeded?: boolean
  canApproveIncrement?: boolean
  atHardCap?: boolean
  pendingAction?: import("@/lib/addy-engine/types").ChatPendingAction
}

export async function getAddyResponse(
  message: string,
  company: Company,
  adsRunning: RunningAd[],
  adLibrary: LibraryAd[],
  assets: BrandingAsset[],
  settings: AddySettings,
  pendingQueue: number,
  options?: {
    assetIds?: string[]
    approveBudget?: boolean
  }
): Promise<AddyResponseResult> {
  let s = resetOpenAiBudgetIfNewDay(settings)
  const attached = options?.assetIds?.length
    ? assets.filter((a) => options.assetIds!.includes(a.id))
    : []

  const pastLessons = await loadCumulativeLessons(company.id, 12)
  const context = buildAddyContext(
    company,
    adsRunning,
    adLibrary,
    assets,
    pendingQueue,
    pastLessons
  )

  let mode = s.aiMode
  if (mode === "mock" && process.env.OPENAI_API_KEY) {
    mode = "openai"
  }
  if (mode === "mock" && !process.env.OPENAI_API_KEY) {
    mode = resolveDefaultAiMode()
  }

  if (mode === "ollama") {
    try {
      const content = await getOllamaResponse(message, context, s.ollamaUrl, s.ollamaModel)
      const { cleanContent, action } = parsePendingAction(content)
      return { content: cleanContent, mode: "ollama", cost: 0, pendingAction: action ?? undefined }
    } catch (e) {
      const fallback = e instanceof Error ? e.message : "Ollama unavailable"
      return {
        content: `${fallback}. Set OPENAI_API_KEY on Vercel for production chat.`,
        mode: "ollama",
        cost: 0,
      }
    }
  }

  const result = await getOpenAIResponse(message, context, s, {
    attachedAssets: attached,
    brandName: company.name,
    approveBudget: options?.approveBudget,
  })

  if (!result.ok) {
    if ("budgetExceeded" in result && result.budgetExceeded) {
      return {
        content: result.message,
        mode: "openai",
        cost: 0,
        budgetExceeded: true,
        canApproveIncrement: result.canApproveIncrement,
        atHardCap: result.atHardCap,
      }
    }
    return { content: result.message, mode: "openai", cost: 0 }
  }

  const { cleanContent, action } = parsePendingAction(result.content)
  s = { ...s, openaiSpentToday: s.openaiSpentToday + result.cost }

  void appendBrandInsight(company.id, message.slice(0, 200), cleanContent.slice(0, 300))

  return {
    content: cleanContent,
    mode: "openai",
    cost: result.cost,
    settingsPatch: { openaiSpentToday: s.openaiSpentToday, openaiSpentDate: s.openaiSpentDate },
    pendingAction: action ?? undefined,
  }
}
