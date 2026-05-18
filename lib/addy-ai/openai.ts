import { ADDY, ADDY_OWNER } from "@/lib/addy"
import {
  OPENAI_ESTIMATED_COST_PER_CALL,
  effectiveOpenAiBudget,
  openAiBudgetRemaining,
  resetOpenAiBudgetIfNewDay,
} from "@/lib/addy-ai/config"
import { ADDY_ACTION_INSTRUCTIONS } from "@/lib/addy-ai/chat-actions"
import type { BrandingAsset } from "@/lib/addy-engine/types"
import type { AddySettings } from "@/lib/addy-engine/types"
import { assetToVisionPart } from "@/lib/addy-ai/asset-vision"

export type OpenAiChatResult =
  | { ok: true; content: string; cost: number }
  | {
      ok: false
      budgetExceeded: true
      canApproveIncrement: boolean
      atHardCap: boolean
      message: string
      cost: 0
    }
  | { ok: false; budgetExceeded?: false; message: string; cost: 0 }

export async function getOpenAIResponse(
  message: string,
  contextPrompt: string,
  settings: AddySettings,
  options?: {
    attachedAssets?: BrandingAsset[]
    brandName?: string
    approveBudget?: boolean
  }
): Promise<OpenAiChatResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return {
      ok: false,
      message:
        "OPENAI_API_KEY is not set on the server. Add it in Vercel → Environment Variables so Addy can run as a real LLM for every brand.",
      cost: 0,
    }
  }

  let s = resetOpenAiBudgetIfNewDay(settings)
  const remaining = openAiBudgetRemaining(s)

  if (remaining < OPENAI_ESTIMATED_COST_PER_CALL && !options?.approveBudget) {
    const canApprove = (s.openaiBonusIncrementsToday ?? 0) < 10
    const atHardCap = !canApprove
    return {
      ok: false,
      budgetExceeded: true,
      canApproveIncrement: canApprove,
      atHardCap,
      message: atHardCap
        ? `Addy's OpenAI budget for today is fully used ($${effectiveOpenAiBudget(s).toFixed(2)}). Top up your OpenAI account at platform.openai.com, then raise the daily cap in Settings tomorrow.`
        : `Addy's chat budget for today is used ($${s.openaiSpentToday.toFixed(3)} / $${effectiveOpenAiBudget(s).toFixed(2)}). Approve a $1 increment to finish this job, or top up OpenAI.`,
      cost: 0,
    }
  }

  const system = [
    `You are ${ADDY.name}, a professional self-learning ad manager.`,
    `Your boss is ${ADDY_OWNER.name} (${ADDY_OWNER.title}). He runs the ad engine; you manage this brand's profit.`,
    `Brand: ${options?.brandName || "client"}.`,
    `Be direct, profit-focused, and plain English. Use bullets when helpful.`,
    ADDY_ACTION_INSTRUCTIONS,
    `Context:\n${contextPrompt}`,
  ].join("\n")

  const userContent: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  > = [{ type: "text", text: message }]

  for (const asset of options?.attachedAssets ?? []) {
    const part = await assetToVisionPart(asset)
    if (part) userContent.push(part)
    else if (asset.type === "video") {
      userContent.push({
        type: "text",
        text: `[Attached video: ${asset.name} — analyze hook/CTA from filename and brand context; suggest profit-focused edits.]`,
      })
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
        { role: "system", content: system },
        { role: "user", content: userContent },
      ],
      max_tokens: 900,
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
  return { ok: true, content, cost: OPENAI_ESTIMATED_COST_PER_CALL }
}
