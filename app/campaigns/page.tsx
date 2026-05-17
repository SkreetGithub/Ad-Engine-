"use client"

import { useState } from "react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { QuickLaunch } from "@/components/campaigns/quick-launch"
import { CampaignCreator } from "@/components/campaigns/campaign-creator"
import { CampaignList } from "@/components/campaigns/campaign-list"
import { BudgetAllocator } from "@/components/campaigns/budget-allocator"
import { AutomationPanel } from "@/components/automation/automation-panel"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function CampaignsPage() {
  const [showCreator, setShowCreator] = useState(false)

  return (
    <DashboardShell
      title="Campaigns"
      subtitle="Launch in one click or create with more control. AI writes the ad and stays on budget."
      actions={
        <Button
          onClick={() => setShowCreator(!showCreator)}
          variant="outline"
          size="sm"
          className="gap-2 border-border text-foreground"
        >
          <Plus className="h-4 w-4" />
          New campaign (advanced)
        </Button>
      }
    >
      <div className="space-y-6">
        <QuickLaunch onLaunch={() => {}} />
        {showCreator && <CampaignCreator onClose={() => setShowCreator(false)} />}
        <AutomationPanel />
        <BudgetAllocator />
        <CampaignList />
      </div>
    </DashboardShell>
  )
}
