import type { CustomerExperienceGoal } from "@/lib/strategies-catalog"

export interface Company {
  id: string
  name: string
  industry: string
  website: string
  notes: string
  targetProfitRatio: number
  customerExperienceGoal: CustomerExperienceGoal
  customerExperienceNotes: string
  strategyIds: string[]
  status: "active" | "paused"
  currentProfitRatio: number
  cxScore: number
  /** Step-by-step or freeform ad strategy for this brand */
  adStrategyPlan: string
  /** Daily ad spend budget ($) */
  dailyAdBudget: number
  /** Current daily profit ($) */
  currentProfit: number
  /** Current daily ad spend ($) */
  currentAdSpend: number
  /** Cut ads when profit ratio falls below this (e.g. 1.5) */
  autoCutThreshold: number
  /** Addy executes queue items without approval */
  autonomousMode: boolean
  /** Minimum ads that should stay running */
  minRunningAds: number
  createdAt: string
  updatedAt: string
}

export interface CompaniesStore {
  activeCompanyId: string | null
  companies: Company[]
}

export type CompanyInput = Omit<
  Company,
  "id" | "createdAt" | "updatedAt" | "currentProfitRatio" | "cxScore"
> & {
  currentProfitRatio?: number
  cxScore?: number
}

export function migrateCompany(c: Partial<Company> & { id: string; name: string }): Company {
  const now = new Date().toISOString()
  return {
    id: c.id,
    name: c.name,
    industry: c.industry ?? "General",
    website: c.website ?? "",
    notes: c.notes ?? "",
    targetProfitRatio: c.targetProfitRatio ?? 3,
    customerExperienceGoal: c.customerExperienceGoal ?? "fast-friendly",
    customerExperienceNotes: c.customerExperienceNotes ?? "",
    strategyIds: c.strategyIds ?? [],
    status: c.status ?? "active",
    currentProfitRatio: c.currentProfitRatio ?? 0,
    cxScore: c.cxScore ?? 70,
    adStrategyPlan: c.adStrategyPlan ?? "",
    dailyAdBudget: c.dailyAdBudget ?? 50,
    currentProfit: c.currentProfit ?? 0,
    currentAdSpend: c.currentAdSpend ?? 0,
    autoCutThreshold: c.autoCutThreshold ?? 1.5,
    autonomousMode: c.autonomousMode ?? false,
    minRunningAds: c.minRunningAds ?? 3,
    createdAt: c.createdAt ?? now,
    updatedAt: c.updatedAt ?? now,
  }
}
