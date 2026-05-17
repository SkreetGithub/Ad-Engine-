"use client"

import { useState } from "react"
import {
  Play,
  Pause,
  Trash2,
  TrendingUp,
  Eye,
  ShoppingCart,
  MoreHorizontal,
  Video,
  Image as ImageIcon,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface CampaignRow {
  id: string
  name: string
  type: "video" | "image"
  strategy: string
  status: "active" | "paused" | "completed" | "draft"
  spent: number
  budget: number
  revenue: number
  impressions: number
  clicks: number
  orders: number
  createdAt: string
}

const campaignData: CampaignRow[] = [
  {
    id: "1",
    name: "Summer Promo Reel",
    type: "video",
    strategy: "Flash Sale Urgency",
    status: "active",
    spent: 8.5,
    budget: 15,
    revenue: 342,
    impressions: 12400,
    clicks: 868,
    orders: 5,
    createdAt: "2 days ago",
  },
  {
    id: "2",
    name: "Product Showcase 15s",
    type: "video",
    strategy: "Product Demo",
    status: "active",
    spent: 5.0,
    budget: 10,
    revenue: 189,
    impressions: 8100,
    clicks: 567,
    orders: 3,
    createdAt: "3 days ago",
  },
  {
    id: "3",
    name: "Customer Testimonial",
    type: "video",
    strategy: "Social Proof",
    status: "paused",
    spent: 12.0,
    budget: 12,
    revenue: 456,
    impressions: 15700,
    clicks: 1099,
    orders: 7,
    createdAt: "5 days ago",
  },
  {
    id: "4",
    name: "Flash Sale Alert",
    type: "image",
    strategy: "Flash Sale Urgency",
    status: "active",
    spent: 3.2,
    budget: 8,
    revenue: 98,
    impressions: 5300,
    clicks: 371,
    orders: 2,
    createdAt: "1 day ago",
  },
  {
    id: "5",
    name: "Behind the Scenes",
    type: "video",
    strategy: "Behind the Scenes",
    status: "completed",
    spent: 10.0,
    budget: 10,
    revenue: 387,
    impressions: 18200,
    clicks: 1274,
    orders: 6,
    createdAt: "1 week ago",
  },
  {
    id: "6",
    name: "New Arrival Carousel",
    type: "image",
    strategy: "Trending Hook",
    status: "draft",
    spent: 0,
    budget: 5,
    revenue: 0,
    impressions: 0,
    clicks: 0,
    orders: 0,
    createdAt: "Just now",
  },
]

const statusConfig = {
  active: { color: "bg-primary/10 text-primary", label: "Active" },
  paused: { color: "bg-accent/10 text-accent", label: "Paused" },
  completed: { color: "bg-chart-2/10 text-chart-2", label: "Done" },
  draft: { color: "bg-muted text-muted-foreground", label: "Draft" },
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

export function CampaignList() {
  const [campaigns, setCampaigns] = useState(campaignData)

  const toggleStatus = (id: string) => {
    setCampaigns(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, status: c.status === "active" ? "paused" : c.status === "paused" ? "active" : c.status }
          : c
      )
    )
  }

  const deleteCampaign = (id: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== id))
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-foreground">
          All Campaigns
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Campaign</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Strategy</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Budget</TableHead>
                <TableHead className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Revenue</TableHead>
                <TableHead className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">ROI</TableHead>
                <TableHead className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Impressions</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => {
                const roi = campaign.spent > 0 ? Math.round(((campaign.revenue - campaign.spent) / campaign.spent) * 100) : 0
                return (
                  <TableRow key={campaign.id} className="border-border">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary">
                          {campaign.type === "video" ? (
                            <Video className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{campaign.name}</p>
                          <p className="text-[10px] text-muted-foreground">{campaign.createdAt}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{campaign.strategy}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("border-0 text-[10px]", statusConfig[campaign.status].color)}>
                        {statusConfig[campaign.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="space-y-1">
                        <span className="font-mono text-xs text-foreground">
                          ${campaign.spent.toFixed(2)} / ${campaign.budget.toFixed(2)}
                        </span>
                        <Progress value={(campaign.spent / campaign.budget) * 100} className="h-0.5" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-bold text-primary">
                      ${campaign.revenue}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn("font-mono text-xs font-bold", roi > 0 ? "text-primary" : "text-muted-foreground")}>
                        {roi > 0 ? `${roi}%` : "--"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      {formatNumber(campaign.impressions)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card">
                          {(campaign.status === "active" || campaign.status === "paused") && (
                            <DropdownMenuItem onClick={() => toggleStatus(campaign.id)} className="gap-2 text-xs">
                              {campaign.status === "active" ? (
                                <><Pause className="h-3 w-3" /> Pause</>
                              ) : (
                                <><Play className="h-3 w-3" /> Resume</>
                              )}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => deleteCampaign(campaign.id)} className="gap-2 text-xs text-destructive">
                            <Trash2 className="h-3 w-3" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
