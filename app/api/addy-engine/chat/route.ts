import { NextResponse } from "next/server"
import { getAddyResponse } from "@/lib/addy-ai"
import { getCompany } from "@/lib/companies-store"
import { appendChat, ensureEngineSeeded, updateSettings } from "@/lib/addy-engine/store"
import { newId } from "@/lib/addy-engine/store"
import type { ChatMessage } from "@/lib/addy-engine/types"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { companyId: string; message: string }
    const company = await getCompany(body.companyId)
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    const engine = await ensureEngineSeeded()
    const running = engine.runningAds.filter((a) => a.companyId === company.id)
    const library = engine.libraryAds.filter((a) => a.companyId === company.id)
    const assets = engine.assets.filter((a) => a.companyId === company.id)
    const pending = engine.queue.filter(
      (q) => q.companyId === company.id && q.status === "pending"
    ).length

    const userMsg: ChatMessage = {
      id: newId("msg"),
      role: "user",
      content: body.message.trim(),
      timestamp: new Date().toISOString(),
    }

    const result = await getAddyResponse(
      body.message,
      company,
      running,
      library,
      assets,
      engine.settings,
      pending
    )

    if (result.settingsPatch) {
      await updateSettings(result.settingsPatch)
    }

    const assistantMsg: ChatMessage = {
      id: newId("msg"),
      role: "assistant",
      content: result.content,
      timestamp: new Date().toISOString(),
      meta: { mode: result.mode, cost: result.cost },
    }

    const chat = await appendChat(company.id, [userMsg, assistantMsg])

    return NextResponse.json({
      messages: chat,
      mode: result.mode,
      cost: result.cost,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Chat failed" },
      { status: 500 }
    )
  }
}
