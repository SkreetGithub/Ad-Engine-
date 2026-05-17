import { OPENAI_ESTIMATED_COST_PER_CALL } from "@/lib/addy-ai/config"
import type { AddySettings } from "@/lib/addy-engine/types"

export async function getOpenAIResponse(
  message: string,
  contextPrompt: string,
  settings: AddySettings
): Promise<{ content: string; cost: number }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return {
      content: "⚠️ OPENAI_API_KEY not set in server env. Use Mock or Ollama mode in Settings.",
      cost: 0,
    }
  }

  const remaining = settings.openaiDailyBudget - settings.openaiSpentToday
  if (remaining < OPENAI_ESTIMATED_COST_PER_CALL) {
    return {
      content: `⚠️ OpenAI daily budget ($${settings.openaiDailyBudget.toFixed(2)}) exceeded. Remaining: $${remaining.toFixed(3)}. Switch to Mock or Ollama.`,
      cost: 0,
    }
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are Addy, a profit-obsessed social media ad manager. Be direct, use bullets when helpful. Context:\n${contextPrompt}`,
        },
        { role: "user", content: message },
      ],
      max_tokens: 600,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI API error: ${err.slice(0, 200)}`)
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const content = data.choices?.[0]?.message?.content?.trim() || "No response."
  return { content, cost: OPENAI_ESTIMATED_COST_PER_CALL }
}
