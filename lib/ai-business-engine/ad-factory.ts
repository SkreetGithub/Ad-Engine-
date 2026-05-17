import { CreativeAgent } from "./creative-agent"
import { TargetingAgent } from "./targeting-agent"
import type { SwarmAd } from "./types"
import { AI_ENGINE_CONFIG } from "./config"

export async function createSwarmAd(budget: number): Promise<SwarmAd> {
  const creative = await CreativeAgent.generate()
  return {
    id: crypto.randomUUID(),
    creative,
    audience: TargetingAgent.pick(),
    budget,
    status: "active",
  }
}

export async function createInitialSwarm(): Promise<SwarmAd[]> {
  const chunk = AI_ENGINE_CONFIG.startingBudget / AI_ENGINE_CONFIG.testAds
  const ads: SwarmAd[] = []
  for (let i = 0; i < AI_ENGINE_CONFIG.testAds; i++) {
    ads.push(await createSwarmAd(chunk))
  }
  return ads
}
