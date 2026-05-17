import { readFile, writeFile, mkdir } from "fs/promises"
import { join } from "path"

const DATA_DIR = join(process.cwd(), ".data")
const FILE_PATH = join(DATA_DIR, "analytics.json")

export interface AnalyticsRow {
  date: string
  campaign_id: string
  campaign_name: string
  spend: number
  impressions: number
  clicks: number
}

export interface AnalyticsStore {
  lastSync: string
  rows: AnalyticsRow[]
}

const emptyStore = (): AnalyticsStore => ({
  lastSync: "",
  rows: [],
})

export async function readStore(): Promise<AnalyticsStore> {
  try {
    const raw = await readFile(FILE_PATH, "utf-8")
    const data = JSON.parse(raw) as AnalyticsStore
    return data && Array.isArray(data.rows) ? data : emptyStore()
  } catch {
    return emptyStore()
  }
}

export async function writeStore(store: AnalyticsStore): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(FILE_PATH, JSON.stringify(store, null, 2), "utf-8")
}

export async function mergeInsights(rows: AnalyticsRow[]): Promise<AnalyticsStore> {
  const store = await readStore()
  const byKey = new Map<string, AnalyticsRow>()
  for (const r of store.rows) {
    byKey.set(`${r.date}|${r.campaign_id}`, r)
  }
  for (const r of rows) {
    byKey.set(`${r.date}|${r.campaign_id}`, r)
  }
  store.rows = Array.from(byKey.values()).sort(
    (a, b) => a.date.localeCompare(b.date) || a.campaign_id.localeCompare(b.campaign_id)
  )
  store.lastSync = new Date().toISOString()
  await writeStore(store)
  return store
}
