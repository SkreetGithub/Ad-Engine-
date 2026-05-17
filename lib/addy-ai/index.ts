import { ADDY_MISSION } from "@/lib/addy"
import type { Company } from "@/lib/companies/types"
import type { AddySettings, BrandingAsset, LibraryAd, RunningAd } from "@/lib/addy-engine/types"
import { getMockResponse } from "@/lib/addy-ai/mock"
import { getOllamaResponse } from "@/lib/addy-ai/ollama"
import { getOpenAIResponse } from "@/lib/addy-ai/openai"
import { resetOpenAiBudgetIfNewDay } from "@/lib/addy-ai/config"

export function buildAddyContext(
  company: Company,
  adsRunning: RunningAd[],
  adLibrary: LibraryAd[],
  assets: BrandingAsset[],
  pendingQueue: number
): string {
  const active = adsRunning.filter((a) => a.status === "active")
  return [
    `Addy's mission: ${ADDY_MISSION}`,
    `Company: ${company.name}`,
    `Target profit ratio: ${company.targetProfitRatio}:1`,
    `Auto-cut threshold: ${company.autoCutThreshold}:1`,
    `CX goal: ${company.customerExperienceGoal} — ${company.customerExperienceNotes}`,
    `Daily budget: $${company.dailyAdBudget}, spend today: $${company.currentAdSpend}, profit today: $${company.currentProfit}`,
    `Strategy: ${company.adStrategyPlan || "(not set)"}`,
    `Autonomous mode: ${company.autonomousMode ? "ON" : "OFF"}`,
    `Running ads (${active.length}): ${active.map((a) => `${a.name} ROI ${a.profitRatio.toFixed(2)}:1 spend $${a.spendToday}`).join("; ") || "none"}`,
    `Library: ${adLibrary.length} ads, ${adLibrary.filter((a) => a.tags.includes("winning")).length} winning`,
    `Branding assets: ${assets.length} files`,
    `Pending queue items: ${pendingQueue}`,
  ].join("\n")
}

export interface AddyResponseResult {
  content: string
  mode: AddySettings["aiMode"]
  cost: number
  settingsPatch?: Partial<AddySettings>
}

export async function getAddyResponse(
  message: string,
  company: Company,
  adsRunning: RunningAd[],
  adLibrary: LibraryAd[],
  assets: BrandingAsset[],
  settings: AddySettings,
  pendingQueue: number
): Promise<AddyResponseResult> {
  let s = resetOpenAiBudgetIfNewDay(settings)
  const context = buildAddyContext(company, adsRunning, adLibrary, assets, pendingQueue)

  if (s.aiMode === "mock") {
    return {
      content: getMockResponse(message, company, adsRunning, adLibrary),
      mode: "mock",
      cost: 0,
    }
  }

  if (s.aiMode === "ollama") {
    try {
      const content = await getOllamaResponse(message, context, s.ollamaUrl, s.ollamaModel)
      return { content, mode: "ollama", cost: 0 }
    } catch (e) {
      const fallback = e instanceof Error ? e.message : "Ollama failed"
      return {
        content: `${fallback}\n\n(Falling back to mock.)\n\n${getMockResponse(message, company, adsRunning, adLibrary)}`,
        mode: "ollama",
        cost: 0,
      }
    }
  }

  const { content, cost } = await getOpenAIResponse(message, context, s)
  s = { ...s, openaiSpentToday: s.openaiSpentToday + cost }
  return {
    content,
    mode: "openai",
    cost,
    settingsPatch: { openaiSpentToday: s.openaiSpentToday, openaiSpentDate: s.openaiSpentDate },
  }
}
