"use client"

import { Video, TrendingUp, TrendingDown, Star } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface ContentScore {
  label: string
  score: number
  maxScore: number
  trend: "up" | "down"
  suggestion: string
}

const contentScores: ContentScore[] = [
  {
    label: "Hook Strength (First 3s)",
    score: 87,
    maxScore: 100,
    trend: "up",
    suggestion: "Strong opening. Keep using direct questions as hooks.",
  },
  {
    label: "Call to Action Clarity",
    score: 72,
    maxScore: 100,
    trend: "up",
    suggestion: "Add a clearer CTA button overlay in the last 2 seconds.",
  },
  {
    label: "Visual Quality",
    score: 91,
    maxScore: 100,
    trend: "up",
    suggestion: "Excellent quality. Maintain current lighting setup.",
  },
  {
    label: "Audio Engagement",
    score: 64,
    maxScore: 100,
    trend: "down",
    suggestion: "Try trending audio tracks - they boost reach by 40%.",
  },
  {
    label: "Caption Effectiveness",
    score: 78,
    maxScore: 100,
    trend: "up",
    suggestion: "Include pricing in first line for 22% more clicks.",
  },
]

export function ContentAnalyzer() {
  const avgScore = Math.round(contentScores.reduce((s, c) => s + c.score, 0) / contentScores.length)

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Content Quality Analysis
            </CardTitle>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5">
            <Star className="h-3 w-3 text-primary" />
            <span className="font-mono text-xs font-bold text-primary">{avgScore}/100</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {contentScores.map((content) => (
          <div key={content.label} className="rounded-lg bg-secondary/30 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground">{content.label}</span>
                {content.trend === "up" ? (
                  <TrendingUp className="h-3 w-3 text-primary" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-destructive" />
                )}
              </div>
              <span className={cn(
                "font-mono text-sm font-bold",
                content.score >= 80 ? "text-primary" : content.score >= 60 ? "text-accent" : "text-destructive"
              )}>
                {content.score}
              </span>
            </div>
            <Progress value={content.score} className="mt-2 h-1" />
            <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">
              {content.suggestion}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
