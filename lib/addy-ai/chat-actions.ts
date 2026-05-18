import type { ChatActionType, ChatPendingAction } from "@/lib/addy-engine/types"

const ACTION_RE = /```addy_action\s*([\s\S]*?)```/i

export function parsePendingAction(content: string): {
  cleanContent: string
  action: ChatPendingAction | null
} {
  const match = content.match(ACTION_RE)
  if (!match) return { cleanContent: content.trim(), action: null }

  let action: ChatPendingAction | null = null
  try {
    const raw = JSON.parse(match[1].trim()) as Record<string, unknown>
    const type = raw.type as ChatActionType
    if (type && raw.message) {
      action = {
        type,
        message: String(raw.message),
        link: raw.link ? String(raw.link) : undefined,
        postId: raw.postId ? String(raw.postId) : undefined,
        dailyBudget: raw.dailyBudget ? Number(raw.dailyBudget) : undefined,
      }
    }
  } catch {
    // ignore malformed blocks
  }

  const cleanContent = content.replace(ACTION_RE, "").trim()
  return { cleanContent, action }
}

export const ADDY_ACTION_INSTRUCTIONS = `
When Demetrius asks you to publish content, end your reply with a fenced block:
\`\`\`addy_action
{"type":"post_facebook","message":"exact post text","link":"optional url"}
\`\`\`
Valid types: post_facebook, post_instagram, post_tiktok, boost_post, run_review.
Only include this block when he explicitly wants to post or boost. He must approve in the UI before it goes live.
`
