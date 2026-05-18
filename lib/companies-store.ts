import type { CompaniesStore, Company, CompanyInput } from "@/lib/companies/types"
import { migrateCompany } from "@/lib/companies/types"
import {
  defaultCompany,
  loadCompaniesStore,
  saveCompaniesStore,
} from "@/lib/addy-persistence"

function newId(): string {
  return `co_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export async function listCompanies(): Promise<CompaniesStore> {
  return loadCompaniesStore()
}

export async function getCompany(id: string): Promise<Company | null> {
  const store = await listCompanies()
  const found = store.companies.find((c) => c.id === id)
  if (found) return found
  if (id === "co_default") {
    const c = defaultCompany()
    store.companies.push(c)
    if (!store.activeCompanyId) store.activeCompanyId = c.id
    await saveCompaniesStore(store)
    return c
  }
  return null
}

export async function createCompany(input: CompanyInput): Promise<Company> {
  const store = await listCompanies()
  const now = new Date().toISOString()
  const company = migrateCompany({
    id: newId(),
    name: input.name.trim(),
    industry: input.industry?.trim() || "General",
    website: input.website?.trim() || "",
    notes: input.notes?.trim() || "",
    targetProfitRatio: Math.max(1, Number(input.targetProfitRatio) || 3),
    customerExperienceGoal: input.customerExperienceGoal || "fast-friendly",
    customerExperienceNotes: input.customerExperienceNotes?.trim() || "",
    strategyIds: Array.isArray(input.strategyIds) ? input.strategyIds : [],
    status: input.status || "active",
    currentProfitRatio: input.currentProfitRatio ?? 0,
    cxScore: input.cxScore ?? 0,
    adStrategyPlan: input.adStrategyPlan ?? "",
    dailyAdBudget: input.dailyAdBudget ?? 50,
    currentProfit: input.currentProfit ?? 0,
    currentAdSpend: input.currentAdSpend ?? 0,
    autoCutThreshold: input.autoCutThreshold ?? 1.5,
    autonomousMode: input.autonomousMode ?? false,
    minRunningAds: input.minRunningAds ?? 3,
    createdAt: now,
    updatedAt: now,
  })
  store.companies.push(company)
  if (!store.activeCompanyId) store.activeCompanyId = company.id
  await saveCompaniesStore(store)
  return company
}

export async function updateCompany(
  id: string,
  patch: Partial<CompanyInput> & { currentProfitRatio?: number; cxScore?: number }
): Promise<Company | null> {
  const store = await listCompanies()
  const idx = store.companies.findIndex((c) => c.id === id)
  if (idx < 0) return null
  const prev = store.companies[idx]
  const updated = migrateCompany({
    ...prev,
    ...patch,
    name: patch.name !== undefined ? patch.name.trim() : prev.name,
    industry: patch.industry !== undefined ? patch.industry.trim() : prev.industry,
    website: patch.website !== undefined ? patch.website.trim() : prev.website,
    notes: patch.notes !== undefined ? patch.notes.trim() : prev.notes,
    customerExperienceNotes:
      patch.customerExperienceNotes !== undefined
        ? patch.customerExperienceNotes.trim()
        : prev.customerExperienceNotes,
    strategyIds: patch.strategyIds !== undefined ? patch.strategyIds : prev.strategyIds,
    targetProfitRatio:
      patch.targetProfitRatio !== undefined
        ? Math.max(1, Number(patch.targetProfitRatio) || prev.targetProfitRatio)
        : prev.targetProfitRatio,
    updatedAt: new Date().toISOString(),
  })
  store.companies[idx] = updated
  await saveCompaniesStore(store)
  return updated
}

export async function deleteCompany(id: string): Promise<boolean> {
  const store = await listCompanies()
  const before = store.companies.length
  store.companies = store.companies.filter((c) => c.id !== id)
  if (store.companies.length === before) return false
  if (store.activeCompanyId === id) {
    store.activeCompanyId = store.companies[0]?.id ?? null
  }
  await saveCompaniesStore(store)
  return true
}

export async function setActiveCompany(id: string): Promise<CompaniesStore> {
  const store = await listCompanies()
  if (!store.companies.some((c) => c.id === id)) {
    throw new Error("Company not found")
  }
  store.activeCompanyId = id
  await saveCompaniesStore(store)
  return store
}
