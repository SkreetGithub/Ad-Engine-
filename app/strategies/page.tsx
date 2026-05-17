"use client"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Zap,
  MessageSquare,
  Camera,
  Film,
  Users,
  Music,
  ArrowRight,
  TrendingUp,
  Star,
  Target,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AdStrategy {
  id: string
  name: string
  description: string
  icon: React.ElementType
  avgRoi: number
  successRate: number
  bestFor: string
  tips: string[]
  color: string
  bgColor: string
}

const strategies: AdStrategy[] = [
  {
    id: "flash",
    name: "Flash Sale Urgency",
    description: "Create time-limited offers that drive immediate action. Use countdown timers, limited stock messaging, and bold pricing in the first 2 seconds.",
    icon: Zap,
    avgRoi: 4200,
    successRate: 87,
    bestFor: "Product launches, clearance, seasonal sales",
    tips: [
      "Use countdown text overlay in the first frame",
      "Show the original price crossed out with the sale price",
      "Add 'Limited Time' or 'Only X Left' urgency markers",
      "End with a direct 'Shop Now' CTA",
    ],
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    id: "social-proof",
    name: "Social Proof / Testimonials",
    description: "Leverage real customer reactions and reviews. Show authentic experiences to build trust and credibility with new audiences.",
    icon: MessageSquare,
    avgRoi: 3800,
    successRate: 82,
    bestFor: "Trust building, new audiences, repeat customers",
    tips: [
      "Start with the customer's reaction, not your product",
      "Include real names and faces for authenticity",
      "Show before/after results when applicable",
      "Keep testimonials under 10 seconds each",
    ],
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
  },
  {
    id: "product-demo",
    name: "Product Demo Showcase",
    description: "Highlight your product's key features and benefits through quick, visually appealing demonstrations that show value instantly.",
    icon: Camera,
    avgRoi: 3500,
    successRate: 79,
    bestFor: "New products, feature highlights, education",
    tips: [
      "Show the product in use within the first 2 seconds",
      "Highlight the problem it solves immediately",
      "Use close-up shots for detail and quality",
      "Include pricing and a link at the end",
    ],
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    id: "behind-scenes",
    name: "Behind the Scenes",
    description: "Show the human side of your business. Manufacturing processes, team culture, and the story behind your products create emotional connections.",
    icon: Film,
    avgRoi: 3200,
    successRate: 75,
    bestFor: "Brand awareness, community building, storytelling",
    tips: [
      "Keep it raw and authentic - no over-production",
      "Show your face or team members for connection",
      "Tell a micro-story within 15 seconds",
      "End with a question to encourage engagement",
    ],
    color: "text-chart-5",
    bgColor: "bg-chart-5/10",
  },
  {
    id: "ugc",
    name: "UGC Style Content",
    description: "Create content that looks user-generated rather than professionally produced. This style feels native to the platform and gets higher engagement.",
    icon: Users,
    avgRoi: 4000,
    successRate: 85,
    bestFor: "High engagement, viral potential, younger audiences",
    tips: [
      "Film with a phone, not professional equipment",
      "Use natural lighting and casual settings",
      "Start with a hook question or surprising statement",
      "Mirror popular creator formats and trends",
    ],
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    id: "trending",
    name: "Trending Audio / Hook",
    description: "Ride trending sounds and viral formats for maximum algorithmic reach. The platform prioritizes content using popular audio.",
    icon: Music,
    avgRoi: 3600,
    successRate: 73,
    bestFor: "Reach expansion, discovery, viral potential",
    tips: [
      "Use currently trending audio from Reels explore page",
      "Adapt the trend to fit your product naturally",
      "Post within 48 hours of trend emergence",
      "Keep your product visible throughout the video",
    ],
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
]

export default function StrategiesPage() {
  return (
    <DashboardShell
      title="Ad Strategy Theaters"
      subtitle="Proven frameworks to maximize your content ROI"
    >
      <div className="space-y-6">
        {/* Strategy overview cards */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="border-border bg-card">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Top Strategy</p>
                <p className="text-sm font-bold text-foreground">Flash Sale Urgency</p>
                <p className="font-mono text-xs text-primary">4,200% avg ROI</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <Target className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Avg Success Rate</p>
                <p className="text-sm font-bold text-foreground">80.2%</p>
                <p className="font-mono text-xs text-accent">Across all strategies</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                <TrendingUp className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Active Strategies</p>
                <p className="text-sm font-bold text-foreground">4 of 6</p>
                <p className="font-mono text-xs text-chart-2">Running campaigns</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Strategy detail cards */}
        <div className="grid gap-4 lg:grid-cols-2">
          {strategies.map((strategy) => {
            const Icon = strategy.icon
            return (
              <Card key={strategy.id} className="border-border bg-card transition-all hover:border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", strategy.bgColor)}>
                        <Icon className={cn("h-4.5 w-4.5", strategy.color)} />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold text-foreground">{strategy.name}</CardTitle>
                        <p className="text-[10px] text-muted-foreground">{strategy.bestFor}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-0 bg-primary/10 font-mono text-[10px] text-primary">
                      {strategy.avgRoi}% ROI
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs leading-relaxed text-muted-foreground">{strategy.description}</p>

                  <div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">Success Rate</span>
                      <span className="font-mono font-bold text-primary">{strategy.successRate}%</span>
                    </div>
                    <Progress value={strategy.successRate} className="mt-1 h-1" />
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Pro Tips
                    </p>
                    {strategy.tips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
                        <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full gap-2 text-xs text-primary hover:bg-primary/10 hover:text-primary"
                  >
                    Use This Strategy <ArrowRight className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </DashboardShell>
  )
}
