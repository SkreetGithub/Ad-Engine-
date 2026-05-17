import type { SwarmAd } from "./types"

function rand(a: number, b: number): number {
  return Math.random() * (b - a) + a
}

/**
 * Simulated analytics per ad. Replace with real Meta Insights when wiring live.
 */
export function analyzeAd(ad: SwarmAd): { ctr: number; roas: number; spend: number; revenue: number } {
  const ctr = rand(0.3, 6)
  const roas = rand(0.4, 7)
  const spend = ad.budget
  const revenue = spend * roas
  return { ctr, roas, spend, revenue }
}
