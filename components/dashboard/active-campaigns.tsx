"use client"

import { Play, Pause, TrendingUp, TrendingDown, MoreHorizontal } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface Campaign {
  id: string
  name: string
  platform: string
  status: "active" | "paused" | "completed"
  spent: number
  budget: number
  revenue: number
  roi: number
  impressions: string
}

const campaigns: Campaign[] = [
  {
    id: "1",
    name: "Summer Promo Reel",
    platform: "Instagram",
    status: "active",
    spent: 8.5,
    budget: 15,
    revenue: 342,
    roi: 4024,
    impressions: "12.4K",
  },
  {
    id: "2",
    name: "Product Showcase 15s",
    platform: "Instagram",
    status: "active",
    spent: 5.0,
    budget: 10,
    revenue: 189,
    roi: 3780,
    impressions: "8.1K",
  },
  {
    id: "3",
    name: "Customer Testimonial",
    platform: "Instagram",
    status: "paused",
    spent: 12.0,
    budget: 12,
    revenue: 456,
    roi: 3800,
    impressions: "15.7K",
  },
  {
    id: "4",
    name: "Flash Sale Alert",
    platform: "Instagram",
    status: "active",
    spent: 3.2,
    budget: 8,
    revenue: 98,
    roi: 3063,
    impressions: "5.3K",
  },
]

export function ActiveCampaigns() {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-foreground">
            Active Campaigns
          </CardTitle>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-primary">
            {campaigns.filter(c => c.status === "active").length} Running
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {campaigns.map((campaign) => (
          <div
            key={campaign.id}
            className="flex flex-col gap-3 rounded-lg border border-border bg-secondary/50 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {campaign.status === "active" ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
                    <Play className="h-3 w-3 text-primary" />
                  </div>
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20">
                    <Pause className="h-3 w-3 text-accent" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">{campaign.name}</p>
                  <p className="text-[10px] text-muted-foreground">{campaign.platform}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Badge
                  variant="outline"
                  className={cn(
                    "border-0 px-1.5 py-0 font-mono text-[10px]",
                    campaign.status === "active"
                      ? "bg-primary/10 text-primary"
                      : "bg-accent/10 text-accent"
                  )}
                >
                  {campaign.status}
                </Badge>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground">
                    ${campaign.spent.toFixed(2)} / ${campaign.budget.toFixed(2)}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {Math.round((campaign.spent / campaign.budget) * 100)}%
                  </span>
                </div>
                <Progress value={(campaign.spent / campaign.budget) * 100} className="h-1" />
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-primary" />
                  <span className="font-mono text-sm font-bold text-primary">
                    ${campaign.revenue}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {campaign.roi}% ROI
                </span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
