import type { CreativeSpec } from "./types"

const HOOKS = [
  "Stop scrolling — this changes everything",
  "This made me $300 from $8",
  "You're missing out big time",
  "Most people never discover this",
  "This is why you're broke",
]

const STYLES = ["cinematic", "ugc", "viral", "luxury", "high-energy"]

function rand(a: number, b: number): number {
  return Math.random() * (b - a) + a
}

export const CreativeAgent = {
  async generate(): Promise<CreativeSpec> {
    return {
      hook: HOOKS[Math.floor(Math.random() * HOOKS.length)]!,
      style: STYLES[Math.floor(Math.random() * STYLES.length)]!,
      pacing: rand(0.6, 1.5),
      cta: "Tap to shop now",
    }
  },

  async mutate(ad: CreativeSpec): Promise<CreativeSpec> {
    return {
      ...ad,
      hook: ad.hook + " (remix)",
      pacing: rand(0.5, 1.7),
    }
  },
}
