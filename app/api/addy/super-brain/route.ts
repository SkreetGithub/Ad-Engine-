import { NextResponse } from "next/server"
import { getCompany } from "@/lib/companies-store"
import { appendChat, newId } from "@/lib/addy-engine/store"
import type { ChatMessage } from "@/lib/addy-engine/types"
import { runSuperBrain } from "@/lib/addy-super-brain"
import {
  assertValidCompanyId,
  checkRateLimit,
  sanitizeChatMessage,
  verifyAddyApiSecret,
} from "@/lib/security/api-guard"

export const dynamic = "force-dynamic"
export const maxDuration = 120

export async function POST(request: Request) {
  if (!verifyAddyApiSecret(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const rate = checkRateLimit(request, { max: 10, windowMs: 60_000, key: "super-brain" })
  if (!rate.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  try {
    const body = (await request.json()) as {
      companyId: string
      question: string
      force?: boolean
    }

    const companyId = assertValidCompanyId(body.companyId)
    const question = sanitizeChatMessage(body.question)

    const company = await getCompany(companyId)
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    const result = await runSuperBrain({
      question,
      companyId,
      brandName: company.name,
      forceSuperBrain: body.force,
    })

    if (!result) {
      return NextResponse.json({
        response: "Ask a technical question (code, optimize, bug, SQL, deploy) to activate Super Brain.",
        usedSuperBrain: false,
      })
    }

    const userMsg: ChatMessage = {
      id: newId("msg"),
      role: "user",
      content: question,
      timestamp: new Date().toISOString(),
    }
    const assistantMsg: ChatMessage = {
      id: newId("msg"),
      role: "assistant",
      content: result.content,
      timestamp: new Date().toISOString(),
      meta: {
        mode: "openai",
        cost: result.cost,
        creativeNote: `super-brain:${result.source}`,
      },
    }

    const messages = await appendChat(companyId, [userMsg, assistantMsg])

    return NextResponse.json({
      response: result.content,
      usedSuperBrain: result.usedSuperBrain,
      source: result.source,
      cursorAgentUrl: result.cursorAgentUrl,
      messages,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Super brain failed" },
      { status: 500 }
    )
  }
}
