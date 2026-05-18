import { getOpenAIResponse } from "@/lib/addy-ai/openai"
import { defaultAddySettings } from "@/lib/addy-ai/config"
import { buildCodebaseContext, isTechnicalQuestion } from "@/lib/addy-super-brain/codebase-context"
import { askCursorCloudAgent } from "@/lib/addy-super-brain/cursor-client"
import { storeSuperLearning } from "@/lib/addy-super-brain/super-learning"

export interface SuperBrainResult {
  content: string
  usedSuperBrain: boolean
  source: "cursor" | "openai-codebase" | "regular"
  cursorAgentUrl?: string
  cost: number
}

export async function runSuperBrain(opts: {
  question: string
  companyId: string
  brandName: string
  forceSuperBrain?: boolean
}): Promise<SuperBrainResult | null> {
  const technical = isTechnicalQuestion(opts.question) || opts.forceSuperBrain
  if (!technical) return null

  const codebase = await buildCodebaseContext()

  if (process.env.CURSOR_API_KEY) {
    const cursor = await askCursorCloudAgent({
      question: opts.question,
      codebaseSummary: codebase,
    })

    if (cursor.ok && cursor.answer) {
      await storeSuperLearning(opts.companyId, opts.question, cursor.answer, {
        usedCursor: true,
        agentUrl: cursor.agentUrl,
      })

      let content = `🧠 **Addy Super Brain** (Cursor analyzed your Ad Engine repo)\n\n${cursor.answer}`
      if (cursor.agentUrl) {
        content += `\n\n[Open full Cursor agent session](${cursor.agentUrl})`
      }

      return {
        content,
        usedSuperBrain: true,
        source: "cursor",
        cursorAgentUrl: cursor.agentUrl,
        cost: 0,
      }
    }
  }

  const settings = defaultAddySettings()
  const openai = await getOpenAIResponse(
    opts.question,
    `You are Addy Super Brain with full codebase access for brand ${opts.brandName}.\n${codebase}`,
    settings,
    {
      brandName: opts.brandName,
      intelligenceContext:
        "Give specific file paths, SQL, and line-level fixes. Demetrius is the owner.",
    }
  )

  if (openai.ok) {
    await storeSuperLearning(opts.companyId, opts.question, openai.content, {
      usedCursor: false,
    })
    return {
      content: `🧠 **Addy Super Brain** (codebase-aware)\n\n${openai.content}`,
      usedSuperBrain: true,
      source: "openai-codebase",
      cost: openai.cost,
    }
  }

  return {
    content: openai.message,
    usedSuperBrain: false,
    source: "regular",
    cost: 0,
  }
}

export { isTechnicalQuestion } from "@/lib/addy-super-brain/codebase-context"
export { verifyCursorApiKey } from "@/lib/addy-super-brain/cursor-client"
