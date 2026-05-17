"use client"

import Link from "next/link"
import {
  Building2,
  ArrowRight,
  Target,
  MessageCircle,
  ListChecks,
} from "lucide-react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AddyAvatar } from "@/components/addy/addy-avatar"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { AiSuggestions } from "@/components/dashboard/ai-suggestions"
import { EngineStatus } from "@/components/dashboard/engine-status"
import { useAddy } from "@/components/providers/addy-provider"
import { ADDY, ADDY_MISSION } from "@/lib/addy"

export default function DashboardPage() {
  const { activeCompany, store } = useAddy()
  const companyCount = store?.companies.length ?? 0

  return (
    <DashboardShell
      title={activeCompany ? `${activeCompany.name}` : `${ADDY.name} Command Center`}
      subtitle={
        activeCompany
          ? `${ADDY.name} · profit-first ad manager — open workspace for daily report & Facebook sync`
          : ADDY.tagline
      }
      actions={
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-primary/30 bg-primary/10 font-mono text-[10px] text-primary">
            {ADDY.name} v{ADDY.version}
          </Badge>
          {activeCompany ? (
            <Button asChild size="sm">
              <Link href={`/companies/${activeCompany.id}`}>
                Open workspace <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link href="/companies">Add your first company</Link>
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card">
          <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center">
            <AddyAvatar size="lg" pulse />
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                {ADDY.role}
              </p>
              <h2 className="mt-1 text-2xl font-bold text-foreground">
                Ad Strategy Manager powered by {ADDY.name}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{ADDY_MISSION}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="secondary">
                  <Link href="/companies">
                    <Building2 className="mr-1.5 h-3.5 w-3.5" />
                    {companyCount} companies
                  </Link>
                </Button>
                {activeCompany && (
                  <>
                    <Button asChild size="sm">
                      <Link href={`/companies/${activeCompany.id}`}>
                        <Target className="mr-1.5 h-3.5 w-3.5" />
                        Daily report
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/companies/${activeCompany.id}?tab=chat`}>
                        <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                        Chat
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <KpiCards />

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Companies",
              desc: "Brands, budgets, profit targets, CX goals",
              href: "/companies",
              icon: Building2,
            },
            {
              title: "Daily review",
              desc: "Facebook sync + plain English report",
              href: activeCompany ? `/companies/${activeCompany.id}` : "/companies",
              icon: ListChecks,
            },
            {
              title: "Settings",
              desc: "Mock / Ollama / OpenAI for Addy",
              href: "/settings",
              icon: Target,
            },
          ].map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href}>
                <Card className="h-full transition-colors hover:border-primary/40">
                  <CardContent className="p-4">
                    <Icon className="h-5 w-5 text-primary" />
                    <p className="mt-2 font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <AiSuggestions />
          <EngineStatus />
        </div>
      </div>
    </DashboardShell>
  )
}
