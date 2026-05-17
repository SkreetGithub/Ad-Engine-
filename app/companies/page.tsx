"use client"

import Link from "next/link"
import { Plus, ArrowRight, Building2 } from "lucide-react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AddyAvatar } from "@/components/addy/addy-avatar"
import { ProfitBadge } from "@/components/addy-workspace/profit-badge"
import { useAddy } from "@/components/providers/addy-provider"
import { ADDY, formatProfitRatio, profitRatioProgress } from "@/lib/addy"
import { CompanyManager } from "@/components/companies/company-manager"

export default function CompaniesPage() {
  const { store, addy } = useAddy()
  const companies = store?.companies ?? []

  return (
    <DashboardShell
      title="Companies"
      subtitle={`${addy.name} manages each brand’s ads, profit ratio, and customer experience`}
    >
      <div className="space-y-8">
        <Card className="border-primary/25 bg-gradient-to-r from-primary/10 via-card to-card">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <AddyAvatar size="lg" pulse />
              <div>
                <h2 className="text-lg font-bold">{ADDY.name} — Ad Strategy Manager</h2>
                <p className="mt-1 max-w-lg text-sm text-muted-foreground">
                  Open a company workspace for ads, library, branding uploads, chat, and daily review queue.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {companies.length > 0 && (
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Open workspace
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {companies.map((c) => {
                const ratio =
                  c.currentAdSpend > 0 ? c.currentProfit / c.currentAdSpend : c.currentProfitRatio
                const pct = profitRatioProgress(ratio, c.targetProfitRatio)
                return (
                  <Link key={c.id} href={`/companies/${c.id}`}>
                    <Card className="group h-full border-border transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <ProfitBadge ratio={ratio} target={c.targetProfitRatio} />
                        </div>
                        <h4 className="mt-3 font-bold text-foreground group-hover:text-primary">
                          {c.name}
                        </h4>
                        <p className="text-[10px] text-muted-foreground">{c.industry}</p>
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-[10px]">
                            <span>Profit progress</span>
                            <span className="font-mono">{formatProfitRatio(ratio)}</span>
                          </div>
                          <Progress value={pct} className="h-1.5" />
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>Budget ${c.dailyAdBudget}/day</span>
                            {c.autonomousMode && (
                              <Badge className="h-4 bg-accent/20 text-[9px] text-accent">Auto</Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-4 w-full gap-1 text-xs text-primary group-hover:bg-primary/10"
                        >
                          Open with {ADDY.name} <ArrowRight className="h-3 w-3" />
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
              <Card className="flex min-h-[200px] items-center justify-center border-dashed border-border">
                <CardContent className="text-center">
                  <Plus className="mx-auto h-6 w-6 text-muted-foreground" />
                  <p className="mt-2 text-xs text-muted-foreground">Add company below</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <CompanyManager />
      </div>
    </DashboardShell>
  )
}
