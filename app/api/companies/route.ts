import { NextRequest, NextResponse } from "next/server"
import {
  createCompany,
  listCompanies,
  setActiveCompany,
} from "@/lib/companies-store"
import type { CompanyInput } from "@/lib/companies/types"

export async function GET() {
  try {
    const store = await listCompanies()
    return NextResponse.json(store)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load companies" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CompanyInput & { setActive?: boolean }
    const company = await createCompany(body)
    if (body.setActive) {
      await setActiveCompany(company.id)
    }
    const store = await listCompanies()
    return NextResponse.json({ company, store }, { status: 201 })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create company" },
      { status: 500 }
    )
  }
}
