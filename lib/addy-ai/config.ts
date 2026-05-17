import type { AddySettings, AiMode } from "@/lib/addy-engine/types"

export const OPENAI_ESTIMATED_COST_PER_CALL = 0.002

export function defaultAddySettings(): AddySettings {
  const today = new Date().toISOString().slice(0, 10)
  return {
    aiMode: "mock",
    openaiDailyBudget: 2,
    openaiSpentToday: 0,
    openaiSpentDate: today,
    ollamaUrl: "http://localhost:11434/api/generate",
    ollamaModel: "llama3.2",
  }
}

export function resetOpenAiBudgetIfNewDay(settings: AddySettings): AddySettings {
  const today = new Date().toISOString().slice(0, 10)
  if (settings.openaiSpentDate !== today) {
    return { ...settings, openaiSpentToday: 0, openaiSpentDate: today }
  }
  return settings
}

export function openAiBudgetRemaining(settings: AddySettings): number {
  const s = resetOpenAiBudgetIfNewDay(settings)
  return Math.max(0, s.openaiDailyBudget - s.openaiSpentToday)
}
