export type AdStatus = "active" | "paused" | "cut" | "draft"
export type QueueAction = "keep" | "cut" | "pause" | "new_ad" | "budget_change"
export type QueueStatus = "pending" | "approved" | "rejected" | "executed" | "scheduled"
export type AiMode = "mock" | "ollama" | "openai"
export type AssetType = "image" | "video" | "pdf" | "text"

export interface RunningAd {
  id: string
  companyId: string
  name: string
  headline: string
  body: string
  cta: string
  targetAudience: string
  creativeAssetId?: string
  libraryAdId?: string
  status: AdStatus
  spendToday: number
  profitToday: number
  profitRatio: number
  ctr: number
  conversions: number
  underperformDays: number
  createdAt: string
  updatedAt: string
}

export interface LibraryAd {
  id: string
  companyId: string
  name: string
  headline: string
  body: string
  cta: string
  targetAudience: string
  creativeAssetId?: string
  tags: string[]
  historicalRoi: number
  historicalSpend: number
  createdAt: string
  updatedAt: string
}

export interface BrandingAsset {
  id: string
  companyId: string
  name: string
  type: AssetType
  mimeType: string
  /** Relative path under .data/branding/ */
  storagePath: string
  size: number
  uploadedAt: string
}

export interface ReviewQueueItem {
  id: string
  companyId: string
  action: QueueAction
  adId?: string
  adName?: string
  reason: string
  debugReason: string
  payload?: Record<string, unknown>
  status: QueueStatus
  policyFlags: string[]
  createdAt: string
  scheduledFor?: string
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: string
  meta?: { mode?: AiMode; cost?: number }
}

export interface AddySettings {
  aiMode: AiMode
  openaiDailyBudget: number
  openaiSpentToday: number
  openaiSpentDate: string
  ollamaUrl: string
  ollamaModel: string
  lastDailyReviewAt?: string
}

/** Addy learning history — one entry per daily review cycle */
export interface ReviewCycleRecord {
  id: string
  companyId: string
  createdAt: string
  metaSynced: boolean
  dailyReport: string
  recommendations: string[]
  lessonsLearned: string[]
  portfolioRatio: number
  spend: number
  profit: number
  queueCuts: number
  queueKeeps: number
  queuePauses: number
  queueNewAds: number
  debugLog: string[]
}

export interface AddyEngineStore {
  settings: AddySettings
  runningAds: RunningAd[]
  libraryAds: LibraryAd[]
  queue: ReviewQueueItem[]
  chats: Record<string, ChatMessage[]>
  assets: BrandingAsset[]
  learningHistory: ReviewCycleRecord[]
}

export interface CompanyEngineView {
  companyId: string
  runningAds: RunningAd[]
  libraryAds: LibraryAd[]
  queue: ReviewQueueItem[]
  chat: ChatMessage[]
  assets: BrandingAsset[]
  settings: AddySettings
  learningHistory: ReviewCycleRecord[]
  latestReport?: ReviewCycleRecord | null
}
