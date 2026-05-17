"use client"

import { useState, useEffect } from "react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, DollarSign, Eye, MousePointer, Loader2, BarChart3 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface AnalyticsRow {
  date: string
  campaign_id: string
  campaign_name: string
  spend: number
  impressions: number
  clicks: number
}

interface AnalyticsData {
  lastSync: string
  rows: AnalyticsRow[]
  summary: { spend: number; impressions: number; clicks: number }
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/analytics?days=7")
      const text = await res.text()
      let json: AnalyticsData | { error?: string }
      try {
        json = text.startsWith("{") ? JSON.parse(text) : { error: "Invalid response from server." }
      } catch {
        setError("Could not load analytics. The server may have returned an error page.")
        setData(null)
        return
      }
      if (!res.ok) {
        setError("error" in json ? json.error : "Failed to load analytics")
        setData(null)
        return
      }
      setData(json as AnalyticsData)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load")
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setError(null)
    try {
      const res = await fetch("/api/analytics/sync", { method: "POST" })
      const contentType = res.headers.get("content-type") || ""
      const text = await res.text()
      let json: { error?: string; details?: string }
      try {
        json = contentType.includes("application/json") && text.startsWith("{") ? JSON.parse(text) : { error: "Server returned an error. Check your API keys and token." }
      } catch {
        setError("Could not read server response. Sync may have failed.")
        return
      }
      if (!res.ok) {
        setError(json.error || "Sync failed")
        return
      }
      await fetchAnalytics()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed")
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  return (
    <DashboardShell
      title="Analytics"
      subtitle="Phase B: Campaign performance from Meta (last 7 days). Sync to pull latest data."
      actions={
        <Button
          size="sm"
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Syncing...</>
          ) : (
            <><RefreshCw className="h-4 w-4" /> Sync from Meta</>
          )}
        </Button>
      }
    >
      <div className="space-y-6">
        {error && (
          <Card className="border-destructive/30 bg-destructive/10">
            <CardContent className="py-3 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        {data && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="border-border bg-card">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total spend (7d)</p>
                    <p className="font-mono text-xl font-bold text-foreground">
                      ${data.summary.spend.toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                    <Eye className="h-5 w-5 text-chart-2" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Impressions</p>
                    <p className="font-mono text-xl font-bold text-foreground">
                      {data.summary.impressions.toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    <MousePointer className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Clicks</p>
                    <p className="font-mono text-xl font-bold text-foreground">
                      {data.summary.clicks.toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-foreground">
                      Last 7 days by campaign
                    </CardTitle>
                  </div>
                  {data.lastSync && (
                    <p className="text-[10px] text-muted-foreground">
                      Last sync: {new Date(data.lastSync).toLocaleString()}
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {data.rows.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No data yet. Click &quot;Sync from Meta&quot; to pull campaign performance.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground">Date</TableHead>
                        <TableHead className="text-muted-foreground">Campaign</TableHead>
                        <TableHead className="text-right text-muted-foreground">Spend</TableHead>
                        <TableHead className="text-right text-muted-foreground">Impressions</TableHead>
                        <TableHead className="text-right text-muted-foreground">Clicks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...data.rows]
                        .sort((a, b) => b.date.localeCompare(a.date) || a.campaign_name.localeCompare(b.campaign_name))
                        .map((row) => (
                          <TableRow key={`${row.date}-${row.campaign_id}`} className="border-border">
                            <TableCell className="font-mono text-xs text-foreground">{row.date}</TableCell>
                            <TableCell className="max-w-[200px] truncate text-xs text-foreground" title={row.campaign_name}>
                              {row.campaign_name || row.campaign_id || "—"}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs text-foreground">
                              ${row.spend.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs text-muted-foreground">
                              {row.impressions.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs text-muted-foreground">
                              {row.clicks.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {loading && !data && (
          <Card className="border-border bg-card">
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  )
}
