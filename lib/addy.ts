/** Addy — your AI social media manager for paid ads */

export const ADDY_OWNER = {
  name: "Demetrius",
  title: "Owner & CEO",
} as const

export const ADDY_MISSION =
  "Maximize profitable ad spend for Demetrius and each brand he manages: cut losers fast, scale winners, protect daily budget, and improve customer experience on every touchpoint."

export const ADDY = {
  name: "Addy",
  role: "Social Media Ad Manager",
  tagline: "Demetrius runs the engine — Addy runs profit for every brand.",
  shortBio:
    "Addy is your per-brand agent: syncs Facebook & Instagram, analyzes creatives you upload, posts when you approve, and compounds lessons in Supabase after every daily review.",
  version: "3.0",
  mission: ADDY_MISSION,
  owner: ADDY_OWNER.name,
} as const

export function formatProfitRatio(ratio: number): string {
  return `${ratio.toFixed(1)}x`
}

export function profitRatioProgress(current: number, target: number): number {
  if (target <= 0) return 0
  return Math.min(100, Math.round((current / target) * 100))
}

export function cxGoalLabel(goalId: string): string {
  const labels: Record<string, string> = {
    "premium-experience": "Premium experience",
    "fast-friendly": "Fast & friendly",
    "value-focused": "Value focused",
    "support-first": "Support first",
    "community-driven": "Community driven",
  }
  return labels[goalId] ?? goalId
}
