import { NextResponse } from "next/server"
import { getCompany } from "@/lib/companies-store"
import { syncMetaForCompany } from "@/lib/addy-engine/meta-sync"
import { ensureEngineSeeded, getCompanyView } from "@/lib/addy-engine/store"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { companyId: string }
    const company = await getCompany(body.companyId)
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    const engine = await ensureEngineSeeded()
    const running = engine.runningAds.filter((a) => a.companyId === company.id)
    const meta = await syncMetaForCompany(company.id, running)
    const view = await getCompanyView(company.id)
    const updatedCompany = await getCompany(company.id)

    return NextResponse.json({
      meta,
      company: updatedCompany,
      view,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Meta sync failed" },
      { status: 500 }
    )
  }
}
