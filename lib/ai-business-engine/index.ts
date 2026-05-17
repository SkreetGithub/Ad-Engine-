/**
 * Full Autonomous AI Business Engine
 *
 * - Reinforcement Learning Brain (decide: scale / kill / mutate / duplicate / newCreative / newAudience)
 * - Neural Profit Prediction (predict profit before spending)
 * - Creative Evolution Engine (generate + mutate)
 * - Supabase Brain Memory (brain_memory, creative_memory, profit_log)
 * - One-cycle API: runOneCycle() for cron or manual trigger
 */

export { runOneCycle, getSwarmAds, resetSwarm } from "./run-cycle"
export { AI_ENGINE_CONFIG } from "./config"
export type { SwarmAd, CreativeSpec, RLState, RLAction, RunCycleResult } from "./types"
export { ReinforcementBrain } from "./reinforcement-brain"
export { NeuralProfitBrain } from "./neural-profit-brain"
export { CreativeAgent } from "./creative-agent"
export { TargetingAgent } from "./targeting-agent"
export { BrainDB } from "./brain-db"
export { createSwarmAd, createInitialSwarm } from "./ad-factory"
export { analyzeAd } from "./analytics"
