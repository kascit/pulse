import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Layout } from "@/components/Layout"
import { MonitorForm } from "@/components/forms/MonitorForm"
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog"
import { monitorsAPI, statsAPI } from "@/lib/api"
import { StatusDot } from "@/lib/status"
import type { Monitor, ResourceStats } from "@/types"
import { formatDistanceToNow, format, differenceInDays } from "date-fns"
import { DetailHeader } from "@/components/ui/DetailHeader"
import { Shield } from "lucide-react"
import { toast } from "sonner"

export default function MonitorDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: monitor, isLoading } = useQuery<Monitor>({
    queryKey: ["monitors", id],
    queryFn: async () => (await monitorsAPI.get(id!)).data,
    enabled: !!id,
  })

  const { data: stats } = useQuery<ResourceStats>({
    queryKey: ["stats", id],
    queryFn: async () => (await statsAPI.get(id!)).data,
    enabled: !!id,
  })

  const pauseMutation = useMutation({
    mutationFn: () => monitorsAPI.update(id!, { isPaused: !monitor?.isPaused }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitors", id] })
      queryClient.invalidateQueries({ queryKey: ["monitors"] })
      toast.success(monitor?.isPaused ? "Monitor resumed" : "Monitor paused")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => monitorsAPI.remove(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitors"] })
      toast.success("Monitor deleted")
      navigate("/monitors")
    },
    onError: () => toast.error("Failed to delete monitor"),
  })

  if (isLoading) return (
    <Layout>
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    </Layout>
  )

  if (!monitor) return (
    <Layout>
      <div className="py-16 text-center">
        <h1 className="mb-2 text-2xl font-bold">Monitor not found</h1>
        <Button variant="outline" onClick={() => navigate("/monitors")}>Back to Monitors</Button>
      </div>
    </Layout>
  )

  const uptime = stats?.totalChecks ? ((stats.upChecks / stats.totalChecks) * 100).toFixed(1) : "—"
  const STATS = [
    { label: "Uptime (24h)", value: `${uptime}%` },
    { label: "Avg Latency", value: stats ? `${stats.avgLatency}ms` : "—" },
    { label: "Total Checks", value: stats?.totalChecks ?? "—" },
    { label: "Incidents", value: stats?.reliability.incidents ?? "—" },
    { label: "MTBF (min)", value: stats?.reliability.mtbf ? `${stats.reliability.mtbf}m` : "N/A" },
    { label: "MTTR (min)", value: stats?.reliability.mttr ? `${stats.reliability.mttr}m` : "N/A" },
  ]

  return (
    <Layout>
      <DetailHeader
        title={monitor.name}
        subtitle={<span className="font-mono">{monitor.url}</span>}
        status={monitor.lastStatus}
        isPaused={monitor.isPaused}
        backUrl="/monitors"
        backLabel="Monitors"
        onEdit={() => setEditOpen(true)}
        onDelete={() => setDeleteOpen(true)}
        onPauseToggle={() => pauseMutation.mutate()}
        isPausePending={pauseMutation.isPending}
      />

      {/* Unified info grid — stats + config + SSL + tags all in one flow */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {STATS.map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}

        {/* Configuration — spans 2 cols so it gets breathing room */}
        <Card className="col-span-2">
          <CardHeader><CardTitle className="text-sm">Configuration</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="flex justify-between col-span-2 sm:col-span-1">
              <span className="text-muted-foreground">Method</span>
              <span className="font-mono">{monitor.method}</span>
            </div>
            <div className="flex justify-between col-span-2 sm:col-span-1">
              <span className="text-muted-foreground">Interval</span>
              <span>{monitor.intervalMinutes}m</span>
            </div>
            {monitor.expectedKeyword && (
              <div className="flex justify-between col-span-2">
                <span className="text-muted-foreground">Keyword</span>
                <Badge variant="outline">{monitor.expectedKeyword}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {monitor.sslExpiryDate && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Shield className="h-4 w-4" /> SSL</CardTitle></CardHeader>
            <CardContent className="text-sm">
              <p>{format(new Date(monitor.sslExpiryDate), "MMM d, yyyy")}</p>
              <p className="text-muted-foreground">{differenceInDays(new Date(monitor.sslExpiryDate), new Date())} days remaining</p>
            </CardContent>
          </Card>
        )}

        {monitor.tags.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Tags</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-1">
              {monitor.tags.map((t) => <Badge key={t} variant="outline">{t}</Badge>)}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent checks */}
      {stats?.recentChecks && stats.recentChecks.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Recent Checks</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentChecks.slice(0, 10).map((c, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className={c.isUp ? "text-green-600" : "text-red-600"}>{c.isUp ? "Up" : "Down"}</span>
                  <span>{c.latencyMs}ms</span>
                  <span className="text-muted-foreground">{formatDistanceToNow(new Date(c.timestamp), { addSuffix: true })}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <MonitorForm open={editOpen} onOpenChange={setEditOpen} item={monitor} />
      <DeleteConfirmDialog
        item={deleteOpen ? monitor : null}
        resourceType="monitor"
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setDeleteOpen(false)}
      />
    </Layout>
  )
}
