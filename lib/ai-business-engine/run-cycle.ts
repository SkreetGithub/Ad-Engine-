import { ReinforcementBrain } from "./reinforcement-brain"
import { NeuralProfitBrain } from "./neural-profit-brain"
import { CreativeAgent } from "./creative-agent"
import { BrainDB } from "./brain-db"
import { analyzeAd } from "./analytics"
import { createSwarmAd, createInitialSwarm } from "./ad-factory"
import { AI_ENGINE_CONFIG } from "./config"
import type { SwarmAd, RLState, RunCycleResult } from "./types"

const rlBrain = new ReinforcementBrain()
const neuralBrain = new NeuralProfitBrain()

/** In-memory swarm state (or load from Supabase ai_swarm_state for persistence across restarts). */
let memoryAds: SwarmAd[] = []
let memoryDataset: { input: number[]; reward: number }[] = []

function getOrCreateAds(): SwarmAd[] {
  if (memoryAds.length === 0) return []
  return memoryAds
}

/**
 * Run one full optimization cycle: observe → decide → act → measure → store → learn → predict.
 * When persistToSupabase is true: loads swarm state from Supabase if present, saves state after cycle.
 */
export async function runOneCycle(options?: {
  existingAds?: SwarmAd[]
  persistToSupabase?: boolean
}): Promise<RunCycleResult> {
  const cycleId = crypto.randomUUID().slice(0, 8)
  const actions: RunCycleResult["actions"] = []
  const persist = options?.persistToSupabase ?? true

  let ads = options?.existingAds ?? getOrCreateAds()

  if (ads.length === 0 && persist) {
    try {
      const saved = await BrainDB.loadSwarmState()
      if (saved?.ads?.length) {
        memoryAds = saved.ads as SwarmAd[]
        memoryDataset = saved.dataset ?? []
        ads = [...memoryAds]
      }
    } catch {
      // ignore; start fresh
    }
  }

  if (ads.length === 0) {
    ads = await createInitialSwarm()
    memoryAds = [...ads]
  }

  if (persist && memoryDataset.length > 0) {
    try {
      await neuralBrain.train(memoryDataset)
    } catch {
      // continue with current model
    }
  }

  try {
    for (const ad of ads) {
      if (ad.status !== "active") continue

      const metrics = analyzeAd(ad)
      const state: RLState = {
        ctr: metrics.ctr,
        roas: metrics.roas,
        spend: metrics.spend,
        style: ad.creative.style,
        audience: ad.audience,
      }

      const nnInput = [
        metrics.ctr,
        metrics.roas,
        metrics.spend,
        ad.creative.pacing,
        Math.random(),
        Math.random(),
      ]
      const predictedProfit = neuralBrain.predict(nnInput)
      const action = rlBrain.decide(state)
      const reward = metrics.revenue - metrics.spend

      actions.push({
        adId: ad.id.slice(0, 6),
        action,
        reward,
        predictedProfit,
      })

      if (action === "kill") ad.status = "killed"
      if (action === "scale") ad.budget *= AI_ENGINE_CONFIG.scaleMultiplier
      if (action === "mutate") {
        const mutated = {
          ...ad,
          id: crypto.randomUUID(),
          creative: await CreativeAgent.mutate(ad.creative),
          budget: ad.budget * 0.6,
        }
        ads.push(mutated)
        memoryAds = [...ads]
      }

      rlBrain.learn(state, action, reward, state)
      memoryDataset.push({ input: nnInput, reward })

      if (persist) {
        await BrainDB.storeCreative(ad.creative)
        await BrainDB.storeMemory({ state, action, reward })
        await BrainDB.storeProfit(reward)
      }
    }

    await neuralBrain.train(memoryDataset)
    memoryAds = [...ads]

    if (persist) {
      try {
        await BrainDB.saveSwarmState(memoryAds, memoryDataset)
      } catch {
        // non-fatal
      }
    }

    return {
      ok: true,
      cycleId,
      adsProcessed: actions.length,
      actions,
      neuralTrained: true,
    }
  } catch (err) {
    return {
      ok: false,
      cycleId,
      adsProcessed: actions.length,
      actions,
      neuralTrained: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/** Get current in-memory ads (for dashboard or debugging). */
export function getSwarmAds(): SwarmAd[] {
  return [...memoryAds]
}

/** Reset swarm to initial state (e.g. new run). */
export async function resetSwarm(): Promise<void> {
  memoryAds = []
  memoryDataset = []
  memoryAds = await createInitialSwarm()
}
