import type { RLState, RLAction } from "./types"
import { AI_ENGINE_CONFIG } from "./config"

const ACTIONS: RLAction[] = [
  "scale",
  "kill",
  "mutate",
  "duplicate",
  "newCreative",
  "newAudience",
]

export class ReinforcementBrain {
  private q: Record<string, Record<string, number>> = {}
  private lr = 0.1
  private discount = 0.9

  private key(s: RLState): string {
    return JSON.stringify(s)
  }

  decide(state: RLState): RLAction {
    const k = this.key(state)
    if (!this.q[k] || Math.random() < AI_ENGINE_CONFIG.exploration) return this.randomAction()
    const entries = Object.entries(this.q[k]).sort((a, b) => b[1] - a[1])
    return (entries[0]?.[0] ?? this.randomAction()) as RLAction
  }

  randomAction(): RLAction {
    return ACTIONS[Math.floor(Math.random() * ACTIONS.length)]!
  }

  learn(prev: RLState, action: string, reward: number, next: RLState): void {
    const pk = this.key(prev)
    const nk = this.key(next)
    this.q[pk] ??= {}
    this.q[pk][action] ??= 0
    const maxNext = Math.max(0, ...Object.values(this.q[nk] ?? { "0": 0 }))
    this.q[pk][action] += this.lr * (reward + this.discount * maxNext - this.q[pk][action])
  }
}
