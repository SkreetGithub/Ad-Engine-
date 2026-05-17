import { NextResponse } from "next/server"
import { getCompany } from "@/lib/companies-store"
import { getCompanyView, getEngineFull } from "@/lib/addy-engine/store"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get("companyId")

  try {
    if (companyId) {
      const company = await getCompany(companyId)
      if (!company) {
        return NextResponse.json({ error: "Company not found" }, { status: 404 })
      }
      const view = await getCompanyView(companyId)
      return NextResponse.json({ company, view })
    }
    const engine = await getEngineFull()
    return NextResponse.json({ engine })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load engine" },
      { status: 500 }
    )
  }
}
