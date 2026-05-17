"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const data = [
  { day: "Mon", revenue: 120, spend: 5 },
  { day: "Tue", revenue: 280, spend: 8 },
  { day: "Wed", revenue: 195, spend: 6 },
  { day: "Thu", revenue: 410, spend: 10 },
  { day: "Fri", revenue: 350, spend: 7 },
  { day: "Sat", revenue: 520, spend: 12 },
  { day: "Sun", revenue: 480, spend: 8 },
]

export function RevenueChart() {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-foreground">
            Revenue vs Spend
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-accent" />
              <span className="text-xs text-muted-foreground">Spend</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 72%, 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142, 72%, 50%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(38, 95%, 55%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(38, 95%, 55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
              <XAxis
                dataKey="day"
                tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }}
                axisLine={{ stroke: "hsl(220, 14%, 18%)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "hsl(215, 15%, 55%)", fontSize: 11 }}
                axisLine={{ stroke: "hsl(220, 14%, 18%)" }}
                tickLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(220, 18%, 10%)",
                  border: "1px solid hsl(220, 14%, 18%)",
                  borderRadius: "8px",
                  color: "hsl(210, 20%, 95%)",
                  fontSize: "12px",
                }}
                formatter={(value: number, name: string) => [`$${value}`, name === "revenue" ? "Revenue" : "Spend"]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(142, 72%, 50%)"
                strokeWidth={2}
                fill="url(#revenueGrad)"
              />
              <Area
                type="monotone"
                dataKey="spend"
                stroke="hsl(38, 95%, 55%)"
                strokeWidth={2}
                fill="url(#spendGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
