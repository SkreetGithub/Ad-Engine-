const AUDIENCES = ["broad", "lookalike", "retarget", "engaged", "high-intent"]

export const TargetingAgent = {
  pick(): string {
    return AUDIENCES[Math.floor(Math.random() * AUDIENCES.length)]!
  },
}
