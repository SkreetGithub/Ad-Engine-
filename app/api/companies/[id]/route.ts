import { NextRequest, NextResponse } from "next/server"
import {
  deleteCompany,
  getCompany,
  listCompanies,
  setActiveCompany,
  updateCompany,
} from "@/lib/companies-store"
import type { CompanyInput } from "@/lib/companies/types"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const company = await getCompany(id)
  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 })
  }
  return NextResponse.json({ company })
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  try {
    const body = (await request.json()) as Partial<CompanyInput> & {
      currentProfitRatio?: number
      cxScore?: number
      setActive?: boolean
    }
    const { setActive, ...patch } = body
    const company = await updateCompany(id, patch)
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }
    if (setActive) await setActiveCompany(id)
    const store = await listCompanies()
    return NextResponse.json({ company, store })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update company" },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const ok = await deleteCompany(id)
  if (!ok) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 })
  }
  const store = await listCompanies()
  return NextResponse.json({ store })
}
