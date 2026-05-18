import { NextResponse } from "next/server"
import {
  OPENAI_BUDGET_INCREMENT,
  canApproveBudgetIncrement,
  resetOpenAiBudgetIfNewDay,
} from "@/lib/addy-ai/config"
import { logBudgetEvent } from "@/lib/addy-persistence/brand-agent"
import { ensureEngineSeeded, updateSettings } from "@/lib/addy-engine/store"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { action: "approve_increment" | "raise_daily_cap"; amount?: number }
    const engine = await ensureEngineSeeded()
    let settings = resetOpenAiBudgetIfNewDay(engine.settings)

    if (body.action === "approve_increment") {
      if (!canApproveBudgetIncrement(settings)) {
        await logBudgetEvent(
          "top_up_required",
          0,
          "Demetrius hit max chat budget increments — top up OpenAI account"
        )
        return NextResponse.json({
          ok: false,
          error: "Max budget increments for today. Top up your OpenAI account at platform.openai.com.",
          atHardCap: true,
        })
      }

      settings = {
        ...settings,
        openaiBonusBudgetToday: (settings.openaiBonusBudgetToday ?? 0) + OPENAI_BUDGET_INCREMENT,
        openaiBonusIncrementsToday: (settings.openaiBonusIncrementsToday ?? 0) + 1,
      }
      await updateSettings(settings)
      await logBudgetEvent(
        "increment_approved",
        OPENAI_BUDGET_INCREMENT,
        `Demetrius approved +$${OPENAI_BUDGET_INCREMENT} chat budget`
      )

      return NextResponse.json({ ok: true, settings })
    }

    if (body.action === "raise_daily_cap" && body.amount && body.amount > 0) {
      settings = {
        ...settings,
        openaiDailyBudget: body.amount,
      }
      await updateSettings(settings)
      await logBudgetEvent("daily_cap_raised", body.amount, "Demetrius raised daily OpenAI cap")
      return NextResponse.json({ ok: true, settings })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Budget update failed" },
      { status: 500 }
    )
  }
}
