import type { AddySettings, AiMode } from "@/lib/addy-engine/types"

export const OPENAI_ESTIMATED_COST_PER_CALL = 0.002
export const OPENAI_BUDGET_INCREMENT = 1
export const MAX_BUDGET_INCREMENTS_PER_DAY = 10

export function resolveDefaultAiMode(): AiMode {
  if (process.env.OPENAI_API_KEY) return "openai"
  if (process.env.OLLAMA_URL) return "ollama"
  return "openai"
}

export function defaultAddySettings(): AddySettings {
  const today = new Date().toISOString().slice(0, 10)
  return {
    aiMode: resolveDefaultAiMode(),
    openaiDailyBudget: 5,
    openaiSpentToday: 0,
    openaiSpentDate: today,
    openaiBonusBudgetToday: 0,
    openaiBonusIncrementsToday: 0,
    ollamaUrl: process.env.OLLAMA_URL || "http://localhost:11434/api/generate",
    ollamaModel: process.env.OLLAMA_MODEL || "llama3.2",
  }
}

export function effectiveOpenAiBudget(settings: AddySettings): number {
  const s = resetOpenAiBudgetIfNewDay(settings)
  return s.openaiDailyBudget + (s.openaiBonusBudgetToday ?? 0)
}

export function resetOpenAiBudgetIfNewDay(settings: AddySettings): AddySettings {
  const today = new Date().toISOString().slice(0, 10)
  if (settings.openaiSpentDate !== today) {
    return {
      ...settings,
      openaiSpentToday: 0,
      openaiSpentDate: today,
      openaiBonusBudgetToday: 0,
      openaiBonusIncrementsToday: 0,
    }
  }
  return settings
}

export function openAiBudgetRemaining(settings: AddySettings): number {
  const s = resetOpenAiBudgetIfNewDay(settings)
  return Math.max(0, effectiveOpenAiBudget(s) - s.openaiSpentToday)
}

export function canApproveBudgetIncrement(settings: AddySettings): boolean {
  const s = resetOpenAiBudgetIfNewDay(settings)
  return (s.openaiBonusIncrementsToday ?? 0) < MAX_BUDGET_INCREMENTS_PER_DAY
}
