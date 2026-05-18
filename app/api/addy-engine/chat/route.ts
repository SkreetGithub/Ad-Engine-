import { NextResponse } from "next/server"
import { getAddyResponse } from "@/lib/addy-ai"
import { getCompany } from "@/lib/companies-store"
import {
  appendChat,
  ensureEngineSeeded,
  newId,
  saveBrandingFile,
  updateSettings,
} from "@/lib/addy-engine/store"
import type { ChatMessage, ChatPendingAction } from "@/lib/addy-engine/types"
import { executeSocialPost, type SocialPlatform } from "@/lib/platforms"
import { logSocialPost } from "@/lib/addy-persistence/brand-agent"

export const dynamic = "force-dynamic"

function actionToPlatform(type: ChatPendingAction["type"]): SocialPlatform | null {
  if (type === "post_facebook") return "facebook"
  if (type === "post_instagram") return "instagram"
  if (type === "post_tiktok") return "tiktok"
  return null
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || ""
    let companyId: string
    let message: string
    let assetIds: string[] = []
    let approveBudget = false
    let confirmAction: ChatPendingAction | null = null

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData()
      companyId = String(form.get("companyId") || "")
      message = String(form.get("message") || "").trim()
      approveBudget = form.get("approveBudget") === "true"
      const ids = form.get("assetIds")
      if (ids) assetIds = JSON.parse(String(ids)) as string[]
      const confirmRaw = form.get("confirmAction")
      if (confirmRaw) confirmAction = JSON.parse(String(confirmRaw)) as ChatPendingAction

      const file = form.get("file")
      if (file && file instanceof File && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer())
        const asset = await saveBrandingFile(
          companyId,
          file.name,
          file.type || "application/octet-stream",
          buffer
        )
        assetIds.push(asset.id)
        if (!message) {
          message = `Analyze this creative for profit potential: ${file.name}`
        }
      }
    } else {
      const body = (await request.json()) as {
        companyId: string
        message: string
        assetIds?: string[]
        approveBudget?: boolean
        confirmAction?: ChatPendingAction
      }
      companyId = body.companyId
      message = body.message?.trim() || ""
      assetIds = body.assetIds ?? []
      approveBudget = body.approveBudget ?? false
      confirmAction = body.confirmAction ?? null
    }

    if (!companyId) {
      return NextResponse.json({ error: "companyId required" }, { status: 400 })
    }

    const company = await getCompany(companyId)
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    if (confirmAction) {
      const platform = actionToPlatform(confirmAction.type)
      if (!platform) {
        return NextResponse.json({ error: "Unsupported action type" }, { status: 400 })
      }
      const post = await executeSocialPost(platform, confirmAction.message, confirmAction.link)
      await logSocialPost(companyId, platform, post.postId, confirmAction.message, {
        ok: post.ok,
        error: post.error,
      })

      const sysMsg: ChatMessage = {
        id: newId("msg"),
        role: "assistant",
        content: post.ok
          ? `Posted to ${platform}. Post ID: ${post.postId}`
          : `Could not post to ${platform}: ${post.error}`,
        timestamp: new Date().toISOString(),
      }
      const chat = await appendChat(companyId, [sysMsg])
      return NextResponse.json({ messages: chat, postResult: post })
    }

    if (!message) {
      return NextResponse.json({ error: "message required" }, { status: 400 })
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
      content: message,
      timestamp: new Date().toISOString(),
      assetIds: assetIds.length ? assetIds : undefined,
    }

    const result = await getAddyResponse(
      message,
      company,
      running,
      library,
      assets,
      engine.settings,
      pending,
      { assetIds, approveBudget }
    )

    if (result.settingsPatch) {
      await updateSettings(result.settingsPatch)
    }

    const assistantMsg: ChatMessage = {
      id: newId("msg"),
      role: "assistant",
      content: result.content,
      timestamp: new Date().toISOString(),
      meta: {
        mode: result.mode,
        cost: result.cost,
        pendingAction: result.pendingAction,
      },
    }

    const chat = await appendChat(company.id, [userMsg, assistantMsg])

    return NextResponse.json({
      messages: chat,
      mode: result.mode,
      cost: result.cost,
      budgetExceeded: result.budgetExceeded,
      canApproveIncrement: result.canApproveIncrement,
      atHardCap: result.atHardCap,
      pendingAction: result.pendingAction,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Chat failed" },
      { status: 500 }
    )
  }
}
