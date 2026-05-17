"use client"

import { Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const hours = ["6AM", "8AM", "10AM", "12PM", "2PM", "4PM", "6PM", "8PM", "10PM"]

// Performance scores 0-100 for each day/hour combo
const heatmapData: number[][] = [
  [15, 22, 35, 42, 38, 45, 62, 78, 55],
  [18, 28, 40, 48, 44, 52, 70, 85, 60],
  [12, 20, 32, 38, 35, 42, 58, 72, 48],
  [20, 32, 45, 55, 50, 60, 82, 92, 68],
  [16, 25, 38, 45, 42, 55, 75, 88, 62],
  [25, 38, 52, 65, 62, 72, 90, 95, 78],
  [22, 35, 48, 58, 55, 68, 85, 91, 72],
]

function getColor(value: number): string {
  if (value >= 85) return "bg-primary text-primary-foreground"
  if (value >= 70) return "bg-primary/60 text-foreground"
  if (value >= 50) return "bg-primary/30 text-foreground"
  if (value >= 30) return "bg-primary/15 text-foreground"
  return "bg-secondary text-muted-foreground"
}

export function PerformanceHeatmap() {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-chart-2" />
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Best Posting Times
            </CardTitle>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>Low</span>
            <div className="flex items-center gap-0.5">
              <div className="h-3 w-6 rounded-sm bg-secondary" />
              <div className="h-3 w-6 rounded-sm bg-primary/15" />
              <div className="h-3 w-6 rounded-sm bg-primary/30" />
              <div className="h-3 w-6 rounded-sm bg-primary/60" />
              <div className="h-3 w-6 rounded-sm bg-primary" />
            </div>
            <span>High</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[500px]">
            {/* Header row */}
            <div className="mb-1 flex items-center">
              <div className="w-10 shrink-0" />
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="flex-1 text-center text-[10px] font-medium text-muted-foreground"
                >
                  {hour}
                </div>
              ))}
            </div>
            {/* Data rows */}
            {days.map((day, dayIndex) => (
              <div key={day} className="mb-1 flex items-center">
                <div className="w-10 shrink-0 text-[10px] font-medium text-muted-foreground">
                  {day}
                </div>
                {heatmapData[dayIndex].map((value, hourIndex) => (
                  <div key={`${day}-${hourIndex}`} className="flex-1 px-0.5">
                    <div
                      className={cn(
                        "flex h-8 items-center justify-center rounded-sm font-mono text-[10px] font-bold transition-all hover:scale-105",
                        getColor(value)
                      )}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-2.5 text-center">
          <p className="text-xs text-foreground">
            <span className="font-semibold text-primary">Peak Performance:</span>{" "}
            Saturday & Sunday evenings (6PM-8PM) show the highest engagement and conversion rates.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
