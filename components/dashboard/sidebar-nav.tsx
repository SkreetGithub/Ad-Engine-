"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Megaphone,
  Brain,
  Settings,
  Key,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Building2,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AddyAvatar } from "@/components/addy/addy-avatar"
import { useAddy } from "@/components/providers/addy-provider"
import { ADDY } from "@/lib/addy"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/optimizer", label: "Addy's Optimizer", icon: Brain },
  { href: "/strategies", label: "Ad Strategies", icon: TrendingUp },
  { href: "/api-keys", label: "API Keys", icon: Key },
  { href: "/settings", label: "Settings", icon: Settings },
]

interface SidebarNavProps {
  collapsed: boolean
  onToggle: () => void
}

export function SidebarNav({ collapsed, onToggle }: SidebarNavProps) {
  const pathname = usePathname()
  const { activeCompany } = useAddy()

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b border-border px-4">
        <AddyAvatar size="sm" pulse />
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground">{ADDY.name}</span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-primary">
              {ADDY.role}
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/companies" && pathname.startsWith("/companies/"))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-full justify-center text-muted-foreground hover:text-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <AddyAvatar size="sm" />
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="truncate text-xs font-medium text-foreground">
                {activeCompany?.name ?? "No company"}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {ADDY.name} is managing ads
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
