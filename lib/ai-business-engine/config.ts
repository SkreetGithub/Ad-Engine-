export const AI_ENGINE_CONFIG = {
  startingBudget: 8,
  scaleThreshold: 3.0,
  killThreshold: 1.1,
  scaleMultiplier: 3,
  exploration: 0.25,
  testAds: 6,
  loopTimeMs: 1000 * 60 * 60 * 6, // 6 hours
} as const
