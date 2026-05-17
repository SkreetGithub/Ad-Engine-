/** Addy — your AI social media manager for paid ads */

export const ADDY_MISSION =
  "Maximize profitable ad spend for the owner: cut losers fast, scale winners, protect daily budget, and improve customer experience on every touchpoint."

export const ADDY = {
  name: "Addy",
  role: "Social Media Manager",
  tagline: "Your ads, her expertise — profit and customer experience in balance.",
  shortBio:
    "Addy runs your Meta ad playbook per company: syncs Facebook data, writes plain-English daily reports, and learns from each review to make you more profit.",
  version: "2.0",
  mission: ADDY_MISSION,
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
