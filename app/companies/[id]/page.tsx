"use client"

import { use } from "react"
import { CompanyWorkspace } from "@/components/addy-workspace/company-workspace"
import { useAddy } from "@/components/providers/addy-provider"
import { useEffect } from "react"

export default function CompanyWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { setActiveCompanyId } = useAddy()

  useEffect(() => {
    void setActiveCompanyId(id)
  }, [id, setActiveCompanyId])

  return <CompanyWorkspace companyId={id} />
}
