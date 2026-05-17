import { NextRequest, NextResponse } from "next/server"
import { listCompanies, setActiveCompany } from "@/lib/companies-store"

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { companyId: string }
    if (!body.companyId) {
      return NextResponse.json({ error: "companyId required" }, { status: 400 })
    }
    const store = await setActiveCompany(body.companyId)
    return NextResponse.json(store)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to set active company" },
      { status: 500 }
    )
  }
}

export async function GET() {
  const store = await listCompanies()
  const active =
    store.companies.find((c) => c.id === store.activeCompanyId) ?? store.companies[0] ?? null
  return NextResponse.json({ active, store })
}
