/** Single ad in the swarm (simulation or linked to Meta ad ID). */
export interface SwarmAd {
  id: string
  creative: CreativeSpec
  audience: string
  budget: number
  status: "active" | "killed"
  /** Optional: Meta campaign/ad set/ad ID when using live Meta ads */
  metaCampaignId?: string
  metaAdsetId?: string
  metaAdId?: string
}

export interface CreativeSpec {
  hook: string
  style: string
  pacing: number
  cta: string
}

export interface RLState {
  ctr: number
  roas: number
  spend: number
  style: string
  audience: string
}

export type RLAction =
  | "scale"
  | "kill"
  | "mutate"
  | "duplicate"
  | "newCreative"
  | "newAudience"

export interface BrainMemoryRow {
  state: RLState
  action: string
  reward: number
}

export interface CreativeMemoryRow {
  hook: string
  style: string
  pacing: number
  cta: string
}

export interface RunCycleResult {
  ok: boolean
  cycleId: string
  adsProcessed: number
  actions: { adId: string; action: string; reward: number; predictedProfit?: number }[]
  neuralTrained: boolean
  error?: string
}
