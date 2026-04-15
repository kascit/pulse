import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Layout } from "@/components/Layout"
import { monitorsAPI, heartbeatsAPI, logsAPI } from "@/lib/api"
import { StatusDot } from "@/lib/status"
import type { Monitor, Heartbeat, Log } from "@/types"
import { formatDistanceToNow } from "date-fns"
import { Activity, Heart, Globe, Bell, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
import { ResourceLink } from "@/components/ResourceLink"
import { EVENT_CONFIG, DEFAULT_EVENT } from "@/lib/events"
import { useState, useCallback } from "react"

export default function Dashboard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [lastRefreshed, setLastRefreshed] = useState(() => new Date())

  const { data: monitors = [], isLoading: mLoading, isFetching: mFetching } = useQuery<Monitor[]>({
    queryKey: ["monitors"],
    queryFn: async () => (await monitorsAPI.list()).data,
  })

  const { data: heartbeats = [], isLoading: hLoading, isFetching: hFetching } = useQuery<Heartbeat[]>({
    queryKey: ["heartbeats"],
    queryFn: async () => (await heartbeatsAPI.list()).data,
  })

  const { data: logsData, isFetching: lFetching } = useQuery({
    queryKey: ["logs", "dashboard"],
    queryFn: async () => (await logsAPI.list({ limit: 5 })).data,
  })

  const isFetching = mFetching || hFetching || lFetching

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["monitors"] })
    queryClient.invalidateQueries({ queryKey: ["heartbeats"] })
    queryClient.invalidateQueries({ queryKey: ["logs", "dashboard"] })
    setLastRefreshed(new Date())
  }, [queryClient])

  const logs: Log[] = logsData?.logs ?? []
  const isLoading = mLoading || hLoading

  const mDown = monitors.filter((m) => m.lastStatus === "down" && !m.isPaused).length
  const hDown = heartbeats.filter((h) => h.lastStatus === "down" && !h.isPaused).length
  const totalDown = mDown + hDown
  const totalAll = monitors.length + heartbeats.length
  const overallStatus = totalDown === 0 ? "operational" : totalDown < totalAll / 2 ? "degraded" : "outage"

  const failing = [...monitors, ...heartbeats].filter((r) => r.lastStatus === "down" && !r.isPaused).slice(0, 5)

  const STAT_CARDS = [
    { label: "Monitors", icon: Activity, href: "/monitors", count: monitors.length, down: mDown, loading: mLoading },
    { label: "Heartbeats", icon: Heart, href: "/heartbeats", count: heartbeats.length, down: hDown, loading: hLoading },
    { label: "Alerts", icon: Bell, href: "/alerts", count: null, loading: false },
    { label: "Status Pages", icon: Globe, href: "/status-pages", count: null, loading: false },
  ]

  return (
    <Layout>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            System overview
            <span className="ml-2 text-xs">
              · updated {formatDistanceToNow(lastRefreshed, { addSuffix: true })}
            </span>
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={isFetching}
          className="gap-2"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Overall status banner */}
      <div className="mb-8 flex items-center gap-3">
        <span className={`h-3 w-3 rounded-full ${overallStatus === "operational" ? "bg-green-500" : overallStatus === "degraded" ? "bg-yellow-500" : "bg-red-500"}`} />
        <div>
          <p className="font-semibold">
            {overallStatus === "operational" ? "All Systems Operational" : overallStatus === "degraded" ? "Partial Degradation" : "Major Outage"}
          </p>
          <p className="text-sm text-muted-foreground">{totalAll - totalDown} of {totalAll} resources healthy</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STAT_CARDS.map(({ label, icon: Icon, href, count, down, loading }) => (
          <Card key={label} className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-sm" onClick={() => navigate(href)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  {loading ? <div className="h-6 w-8 animate-pulse rounded bg-muted" /> : <p className="text-2xl font-bold">{count ?? "—"}</p>}
                </div>
              </div>
              {!loading && count != null && count > 0 && (
                <div className="mt-3 flex gap-3 text-xs">
                  <span className="text-green-600">{count - (down ?? 0)} up</span>
                  {(down ?? 0) > 0 && <span className="text-red-600">{down} down</span>}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Resource health */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              {failing.length === 0
                ? <><CheckCircle className="h-4 w-4 text-green-500" /> All Clear</>
                : <><AlertCircle className="h-4 w-4 text-destructive" /> Failing Resources ({failing.length})</>}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-px">
                {[...Array(3)].map((_, i) => <div key={i} className="h-12 animate-pulse bg-muted" />)}
              </div>
            ) : failing.length === 0 ? (
              <p className="px-6 py-6 text-sm text-muted-foreground">All resources are healthy.</p>
            ) : (
              <div className="divide-y">
                {failing.map((r) => (
                  <div
                    key={r._id}
                    className="flex cursor-pointer items-center justify-between px-6 py-3 transition-colors hover:bg-muted/30"
                    onClick={() => navigate(r.resourceType === "Monitor" ? `/monitors/${r._id}` : `/heartbeats/${r._id}`)}
                  >
                    <ResourceLink id={r._id} name={r.name} type={r.resourceType} status={r.lastStatus} />
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {r.lastCheckedAt ? formatDistanceToNow(new Date(r.lastCheckedAt), { addSuffix: true }) : "Never"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {logs.length === 0 ? (
              <p className="px-6 py-6 text-center text-sm text-muted-foreground">No recent activity</p>
            ) : (
              <div className="divide-y">
                {logs.map((log) => {
                  const cfg = EVENT_CONFIG[log.event] ?? DEFAULT_EVENT
                  const Icon = cfg.icon
                  return (
                    <div
                      key={log._id}
                      className="flex cursor-pointer items-start gap-3 px-6 py-3 transition-colors hover:bg-muted/30"
                      onClick={() => navigate(`/logs/${log._id}`)}
                    >
                      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${cfg.color}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{log.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
