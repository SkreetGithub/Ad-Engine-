import { readFile, writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { defaultAddySettings } from "@/lib/addy-ai/config"
import type {
  AddyEngineStore,
  AddySettings,
  BrandingAsset,
  ChatMessage,
  CompanyEngineView,
  LibraryAd,
  ReviewCycleRecord,
  ReviewQueueItem,
  RunningAd,
} from "@/lib/addy-engine/types"
import { getCompany, listCompanies, updateCompany } from "@/lib/companies-store"
import { migrateCompany } from "@/lib/companies/types"

const DATA_DIR = join(process.cwd(), ".data")
const ENGINE_PATH = join(DATA_DIR, "addy-engine.json")
const BRANDING_DIR = join(DATA_DIR, "branding")

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function emptyEngine(): AddyEngineStore {
  return {
    settings: defaultAddySettings(),
    runningAds: [],
    libraryAds: [],
    queue: [],
    chats: {},
    assets: [],
    learningHistory: [],
  }
}

function seedSampleAds(companyId: string): { running: RunningAd[]; library: LibraryAd[] } {
  const now = new Date().toISOString()
  const library: LibraryAd[] = [
    {
      id: newId("lib"),
      companyId,
      name: "Summer Sale V2",
      headline: "Summer picks — limited stock",
      body: "Shop our best sellers before they're gone. Free shipping over $50.",
      cta: "Shop Now",
      targetAudience: "US 25-45, interest shoppers",
      tags: ["winning", "seasonal"],
      historicalRoi: 4.2,
      historicalSpend: 1200,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: newId("lib"),
      companyId,
      name: "UGC Testimonial",
      headline: "Customers love us",
      body: "Real reviews from real buyers. See why we're rated 4.9★",
      cta: "See Reviews",
      targetAudience: "Broad US, retargeting",
      tags: ["testing", "social-proof"],
      historicalRoi: 2.8,
      historicalSpend: 400,
      createdAt: now,
      updatedAt: now,
    },
  ]

  const running: RunningAd[] = [
    {
      id: newId("ad"),
      companyId,
      name: "Summer Sale V2 — Live",
      headline: library[0].headline,
      body: library[0].body,
      cta: library[0].cta,
      targetAudience: library[0].targetAudience,
      libraryAdId: library[0].id,
      status: "active",
      spendToday: 18.5,
      profitToday: 72,
      profitRatio: 3.89,
      ctr: 2.4,
      conversions: 12,
      underperformDays: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: newId("ad"),
      companyId,
      name: "UGC Testimonial — Live",
      headline: library[1].headline,
      body: library[1].body,
      cta: library[1].cta,
      targetAudience: library[1].targetAudience,
      libraryAdId: library[1].id,
      status: "active",
      spendToday: 12,
      profitToday: 22,
      profitRatio: 1.83,
      ctr: 1.8,
      conversions: 5,
      underperformDays: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: newId("ad"),
      companyId,
      name: "Flash Weekend",
      headline: "48hr flash — 20% off",
      body: "Weekend only. Use code FLASH20 at checkout.",
      cta: "Get Code",
      targetAudience: "Engaged shoppers 18-55",
      status: "active",
      spendToday: 8,
      profitToday: 6,
      profitRatio: 0.75,
      ctr: 0.9,
      conversions: 2,
      underperformDays: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: newId("ad"),
      companyId,
      name: "Brand Story — Paused",
      headline: "Meet the team behind the brand",
      body: "Authentic story, quality you can trust.",
      cta: "Learn More",
      targetAudience: "Awareness broad",
      status: "paused",
      spendToday: 0,
      profitToday: 0,
      profitRatio: 0,
      ctr: 0,
      conversions: 0,
      underperformDays: 0,
      createdAt: now,
      updatedAt: now,
    },
  ]

  return { running, library }
}

export async function readEngine(): Promise<AddyEngineStore> {
  try {
    const raw = await readFile(ENGINE_PATH, "utf-8")
    const data = JSON.parse(raw) as AddyEngineStore
    if (!data.settings) data.settings = defaultAddySettings()
    data.runningAds = data.runningAds ?? []
    data.libraryAds = data.libraryAds ?? []
    data.queue = data.queue ?? []
    data.chats = data.chats ?? {}
    data.assets = data.assets ?? []
    data.learningHistory = data.learningHistory ?? []
    return data
  } catch {
    return emptyEngine()
  }
}

export async function writeEngine(store: AddyEngineStore): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(ENGINE_PATH, JSON.stringify(store, null, 2), "utf-8")
}

export async function ensureEngineSeeded(): Promise<AddyEngineStore> {
  const companiesStore = await listCompanies()
  let engine = await readEngine()
  let changed = false

  companiesStore.companies = companiesStore.companies.map((c) => {
    const m = migrateCompany(c)
    if (JSON.stringify(m) !== JSON.stringify(c)) changed = true
    return m
  })

  for (const company of companiesStore.companies) {
    const hasAds = engine.runningAds.some((a) => a.companyId === company.id)
    if (!hasAds) {
      const { running, library } = seedSampleAds(company.id)
      engine.runningAds.push(...running)
      engine.libraryAds.push(...library)
      changed = true
      const spend = running.filter((a) => a.status === "active").reduce((s, a) => s + a.spendToday, 0)
      const profit = running.filter((a) => a.status === "active").reduce((s, a) => s + a.profitToday, 0)
      await updateCompany(company.id, {
        currentAdSpend: spend,
        currentProfit: profit,
        currentProfitRatio: spend > 0 ? profit / spend : 0,
      })
    }
  }

  if (changed) {
    await writeEngine(engine)
    if (companiesStore.companies.some((c, i) => c !== companiesStore.companies[i])) {
      // companies migrated via updateCompany above
    }
  }

  return engine
}

export async function getCompanyView(companyId: string): Promise<CompanyEngineView | null> {
  const company = await getCompany(companyId)
  if (!company) return null
  const engine = await ensureEngineSeeded()
  const history = (engine.learningHistory ?? [])
    .filter((h) => h.companyId === companyId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return {
    companyId,
    runningAds: engine.runningAds.filter((a) => a.companyId === companyId),
    libraryAds: engine.libraryAds.filter((a) => a.companyId === companyId),
    queue: engine.queue.filter((q) => q.companyId === companyId),
    chat: engine.chats[companyId] ?? [],
    assets: engine.assets.filter((a) => a.companyId === companyId),
    settings: engine.settings,
    learningHistory: history,
    latestReport: history[0] ?? null,
  }
}

export async function appendLearningHistory(record: ReviewCycleRecord): Promise<void> {
  const engine = await ensureEngineSeeded()
  if (!engine.learningHistory) engine.learningHistory = []
  engine.learningHistory.push(record)
  if (engine.learningHistory.length > 200) {
    engine.learningHistory = engine.learningHistory.slice(-200)
  }
  await writeEngine(engine)
}

export async function updateSettings(patch: Partial<AddySettings>): Promise<AddySettings> {
  const engine = await ensureEngineSeeded()
  engine.settings = { ...engine.settings, ...patch }
  await writeEngine(engine)
  return engine.settings
}

export async function addRunningAd(ad: Omit<RunningAd, "id" | "createdAt" | "updatedAt">): Promise<RunningAd> {
  const engine = await ensureEngineSeeded()
  const now = new Date().toISOString()
  const full: RunningAd = {
    ...ad,
    id: newId("ad"),
    profitRatio: ad.spendToday > 0 ? ad.profitToday / ad.spendToday : 0,
    createdAt: now,
    updatedAt: now,
  }
  engine.runningAds.push(full)
  await writeEngine(engine)
  return full
}

export async function updateRunningAd(id: string, patch: Partial<RunningAd>): Promise<RunningAd | null> {
  const engine = await ensureEngineSeeded()
  const idx = engine.runningAds.findIndex((a) => a.id === id)
  if (idx < 0) return null
  const prev = engine.runningAds[idx]
  const next = {
    ...prev,
    ...patch,
    profitRatio:
      patch.profitRatio !== undefined
        ? patch.profitRatio
        : patch.profitToday !== undefined || patch.spendToday !== undefined
          ? (() => {
              const s = patch.spendToday ?? prev.spendToday
              const p = patch.profitToday ?? prev.profitToday
              return s > 0 ? (p + s) / s : 0
            })()
          : prev.profitRatio,
    updatedAt: new Date().toISOString(),
  }
  engine.runningAds[idx] = next
  await writeEngine(engine)
  return next
}

export async function addLibraryAd(ad: Omit<LibraryAd, "id" | "createdAt" | "updatedAt">): Promise<LibraryAd> {
  const engine = await ensureEngineSeeded()
  const now = new Date().toISOString()
  const full: LibraryAd = { ...ad, id: newId("lib"), createdAt: now, updatedAt: now }
  engine.libraryAds.push(full)
  await writeEngine(engine)
  return full
}

export async function addQueueItems(items: ReviewQueueItem[]): Promise<void> {
  const engine = await ensureEngineSeeded()
  engine.queue.push(...items)
  engine.settings.lastDailyReviewAt = new Date().toISOString()
  await writeEngine(engine)
}

export async function updateQueueItem(
  id: string,
  patch: Partial<ReviewQueueItem>
): Promise<ReviewQueueItem | null> {
  const engine = await ensureEngineSeeded()
  const idx = engine.queue.findIndex((q) => q.id === id)
  if (idx < 0) return null
  engine.queue[idx] = { ...engine.queue[idx], ...patch }
  await writeEngine(engine)
  return engine.queue[idx]
}

export async function appendChat(companyId: string, messages: ChatMessage[]): Promise<ChatMessage[]> {
  const engine = await ensureEngineSeeded()
  engine.chats[companyId] = [...(engine.chats[companyId] ?? []), ...messages]
  await writeEngine(engine)
  return engine.chats[companyId]
}

export async function saveBrandingFile(
  companyId: string,
  name: string,
  mimeType: string,
  buffer: Buffer
): Promise<BrandingAsset> {
  await mkdir(join(BRANDING_DIR, companyId), { recursive: true })
  const id = newId("asset")
  const ext = mimeType.split("/")[1]?.split("+")[0] || "bin"
  const storagePath = join("branding", companyId, `${id}.${ext}`)
  const fullPath = join(DATA_DIR, storagePath)
  await writeFile(fullPath, buffer)

  let type: BrandingAsset["type"] = "image"
  if (mimeType.startsWith("video/")) type = "video"
  else if (mimeType === "application/pdf") type = "pdf"
  else if (mimeType.startsWith("text/")) type = "text"

  const engine = await ensureEngineSeeded()
  const asset: BrandingAsset = {
    id,
    companyId,
    name,
    type,
    mimeType,
    storagePath,
    size: buffer.length,
    uploadedAt: new Date().toISOString(),
  }
  engine.assets.push(asset)
  await writeEngine(engine)
  return asset
}

export async function getEngineFull(): Promise<AddyEngineStore> {
  return ensureEngineSeeded()
}
