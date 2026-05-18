import { NextResponse } from "next/server"
import { getAddyResponse } from "@/lib/addy-ai"
import { buildIntelligenceContext } from "@/lib/addy-intelligence/context"
import { createAbTest } from "@/lib/addy-intelligence/ab-tests"
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
import { runAutoBoost } from "@/lib/addy-intelligence/auto-boost"
import { storeMemoryEntry } from "@/lib/addy-intelligence/memory"
import { getSupabase, hasSupabase } from "@/lib/supabase"
import {
  assertBodySize,
  assertUploadSize,
  assertValidCompanyId,
  checkRateLimit,
  sanitizeChatMessage,
  verifyAddyApiSecret,
} from "@/lib/security/api-guard"

export const dynamic = "force-dynamic"

function actionToPlatform(type: ChatPendingAction["type"]): SocialPlatform | null {
  if (type === "post_facebook") return "facebook"
  if (type === "post_instagram") return "instagram"
  if (type === "post_tiktok") return "tiktok"
  return null
}

export async function POST(request: Request) {
  if (!verifyAddyApiSecret(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const rate = checkRateLimit(request, { max: 40, windowMs: 60_000, key: "smart-chat" })
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Too many requests", retryAfterSec: rate.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
    )
  }

  assertBodySize(request.headers.get("content-length"))

  try {
    const contentType = request.headers.get("content-type") || ""
    let companyId: string
    let message: string
    let assetIds: string[] = []
    let approveBudget = false
    let confirmAction: ChatPendingAction | null = null
    let autoBoost = false
    let boostBudget = 5

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData()
      companyId = assertValidCompanyId(form.get("companyId"))
      message = sanitizeChatMessage(String(form.get("message") || ""))
      approveBudget = form.get("approveBudget") === "true"
      autoBoost = form.get("autoBoost") === "true"
      boostBudget = Math.min(50, Math.max(1, Number(form.get("boostBudget")) || 5))
      const ids = form.get("assetIds")
      if (ids) assetIds = JSON.parse(String(ids)) as string[]
      const confirmRaw = form.get("confirmAction")
      if (confirmRaw) confirmAction = JSON.parse(String(confirmRaw)) as ChatPendingAction

      const file = form.get("file")
      if (file && file instanceof File && file.size > 0) {
        assertUploadSize(file.size)
        const buffer = Buffer.from(await file.arrayBuffer())
        const asset = await saveBrandingFile(
          companyId,
          file.name.replace(/[^\w.\-]/g, "_"),
          file.type || "application/octet-stream",
          buffer
        )
        assetIds.push(asset.id)
        if (!message) message = `Analyze profit potential for this creative: ${file.name}`
      }
    } else {
      const body = (await request.json()) as {
        companyId: string
        message: string
        assetIds?: string[]
        approveBudget?: boolean
        confirmAction?: ChatPendingAction
        autoBoost?: boolean
        boostBudget?: number
      }
      companyId = assertValidCompanyId(body.companyId)
      message = sanitizeChatMessage(body.message || "")
      assetIds = body.assetIds ?? []
      approveBudget = body.approveBudget ?? false
      confirmAction = body.confirmAction ?? null
      autoBoost = body.autoBoost ?? false
      boostBudget = Math.min(50, Math.max(1, body.boostBudget ?? 5))
    }

    const company = await getCompany(companyId)
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    if (confirmAction) {
      const platform = actionToPlatform(confirmAction.type)
      if (!platform) {
        return NextResponse.json({ error: "Unsupported action" }, { status: 400 })
      }
      const post = await executeSocialPost(platform, confirmAction.message, confirmAction.link)

      let boostResult = null
      const shouldBoost = confirmAction.autoBoost ?? autoBoost
      if (post.ok && post.postId && shouldBoost) {
        boostResult = await runAutoBoost(
          companyId,
          post.postId,
          confirmAction.boostBudget ?? boostBudget
        )
      }

      let socialRowId: string | undefined
      if (hasSupabase()) {
        const { data } = await getSupabase()
          .from("addy_social_posts")
          .insert({
            company_id: companyId,
            platform,
            external_post_id: post.postId,
            message: confirmAction.message,
            auto_boost: shouldBoost,
            boost_budget: confirmAction.boostBudget ?? boostBudget,
            boost_status: boostResult?.ok ? "boosting" : shouldBoost ? "pending" : "none",
            payload: { boostResult },
          })
          .select("id")
          .single()
        socialRowId = data?.id
        if (socialRowId && boostResult?.ok) {
          await getSupabase()
            .from("addy_social_posts")
            .update({ boost_status: "completed" })
            .eq("id", socialRowId)
        }
      }

      const content = post.ok
        ? `Posted to ${platform}.${post.postId ? ` ID: ${post.postId}` : ""}${
            boostResult?.ok
              ? ` Auto-boost started ($${confirmAction.boostBudget ?? boostBudget}).`
              : shouldBoost
                ? ` Boost queued — ${boostResult?.error || "configure Meta ads"}`
                : ""
          }`
        : `Post failed: ${post.error}`

      const sysMsg: ChatMessage = {
        id: newId("msg"),
        role: "assistant",
        content,
        timestamp: new Date().toISOString(),
      }
      const chat = await appendChat(companyId, [sysMsg])
      await storeMemoryEntry(companyId, `Posted to ${platform}: ${confirmAction.message.slice(0, 120)}`, {
        impactScore: post.ok ? 0.75 : 0.3,
        source: "post",
      })
      return NextResponse.json({ messages: chat, postResult: post, boostResult })
    }

    if (!message) {
      return NextResponse.json({ error: "message required" }, { status: 400 })
    }

    if (/test two headlines|a\/b test|ab test/i.test(message)) {
      const parts = message.split(/vs|versus|\//i)
      if (parts.length >= 2) {
        await createAbTest(
          companyId,
          `Headline test ${new Date().toISOString().slice(0, 10)}`,
          parts[0].trim().slice(0, 200),
          parts[1].trim().slice(0, 200)
        )
      }
    }

    const engine = await ensureEngineSeeded()
    const running = engine.runningAds.filter((a) => a.companyId === company.id)
    const library = engine.libraryAds.filter((a) => a.companyId === company.id)
    const assets = engine.assets.filter((a) => a.companyId === company.id)
    const pending = engine.queue.filter(
      (q) => q.companyId === company.id && q.status === "pending"
    ).length

    const intel = await buildIntelligenceContext(company, message, running)
    const intelligenceContext = [intel.memoryBlock, intel.predictionBlock, intel.competitiveBlock]
      .filter(Boolean)
      .join("\n\n")

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
      { assetIds, approveBudget, intelligenceContext }
    )

    if (result.settingsPatch) await updateSettings(result.settingsPatch)

    let displayContent = result.content
    if (intel.prediction) {
      displayContent += `\n\n📈 Predicted ROI: ${intel.prediction.predictedRoi.toFixed(2)}:1 (${(intel.prediction.confidenceScore * 100).toFixed(0)}% confidence)\n💰 Suggested test budget: $${intel.prediction.suggestedBudget.toFixed(0)}\n${intel.prediction.verdict}`
    }
    if (result.pendingAction && intel.prediction && intel.prediction.predictedRoi >= company.targetProfitRatio) {
      displayContent += `\n\nThis looks like a winner based on your history. Enable **Auto-boost** when you approve the post.`
    }

    const assistantMsg: ChatMessage = {
      id: newId("msg"),
      role: "assistant",
      content: displayContent,
      timestamp: new Date().toISOString(),
      meta: {
        mode: result.mode,
        cost: result.cost,
        pendingAction: result.pendingAction
          ? {
              ...result.pendingAction,
              autoBoost: result.pendingAction.autoBoost ?? intel.prediction?.predictedRoi >= company.targetProfitRatio,
              boostBudget: result.pendingAction.boostBudget ?? 5,
            }
          : undefined,
        prediction: intel.prediction ?? undefined,
        memoriesUsed: intel.memoriesUsed,
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
      pendingAction: assistantMsg.meta?.pendingAction,
      prediction: intel.prediction,
      memoryUsed: intel.memoriesUsed > 0,
      memoriesUsed: intel.memoriesUsed,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Smart chat failed"
    const status = msg.includes("Invalid") || msg.includes("too large") ? 400 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
