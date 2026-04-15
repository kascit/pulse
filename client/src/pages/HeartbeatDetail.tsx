import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Layout } from "@/components/Layout"
import { HeartbeatForm } from "@/components/forms/HeartbeatForm"
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog"
import { heartbeatsAPI, statsAPI } from "@/lib/api"
import { StatusDot } from "@/lib/status"
import type { Heartbeat, ResourceStats } from "@/types"
import { formatDistanceToNow } from "date-fns"
import { DetailHeader } from "@/components/ui/DetailHeader"
import { Copy, Check } from "lucide-react"
import { toast } from "sonner"

export default function HeartbeatDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: heartbeat, isLoading } = useQuery<Heartbeat>({
    queryKey: ["heartbeats", id],
    queryFn: async () => (await heartbeatsAPI.get(id!)).data,
    enabled: !!id,
  })

  const { data: stats } = useQuery<ResourceStats>({
    queryKey: ["stats", id],
    queryFn: async () => (await statsAPI.get(id!)).data,
    enabled: !!id,
  })

  const pauseMutation = useMutation({
    mutationFn: () => heartbeatsAPI.update(id!, { isPaused: !heartbeat?.isPaused }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["heartbeats", id] })
      queryClient.invalidateQueries({ queryKey: ["heartbeats"] })
      toast.success(heartbeat?.isPaused ? "Heartbeat resumed" : "Heartbeat paused")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => heartbeatsAPI.remove(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["heartbeats"] })
      toast.success("Heartbeat deleted")
      navigate("/heartbeats")
    },
    onError: () => toast.error("Failed to delete heartbeat"),
  })

  const pingUrl = heartbeat ? heartbeatsAPI.pingUrl(heartbeat.heartbeatToken) : ""

  const copyUrl = () => {
    navigator.clipboard.writeText(pingUrl)
    setCopied(true)
    toast.success("Ping URL copied")
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) return (
    <Layout>
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    </Layout>
  )

  if (!heartbeat) return (
    <Layout>
      <div className="py-16 text-center">
        <h1 className="mb-2 text-2xl font-bold">Heartbeat not found</h1>
        <Button variant="outline" onClick={() => navigate("/heartbeats")}>Back to Heartbeats</Button>
      </div>
    </Layout>
  )

  const STATS = [
    { label: "Last Ping", value: heartbeat.lastPingedAt ? formatDistanceToNow(new Date(heartbeat.lastPingedAt), { addSuffix: true }) : "Never" },
    { label: "Total Pings (24h)", value: stats?.totalChecks ?? "—" },
    { label: "Incidents", value: stats?.reliability.incidents ?? "—" },
    { label: "Availability", value: stats ? `${stats.reliability.availability?.toFixed(1)}%` : "—" },
    { label: "MTBF (min)", value: stats?.reliability.mtbf ? `${stats.reliability.mtbf}m` : "N/A" },
    { label: "MTTR (min)", value: stats?.reliability.mttr ? `${stats.reliability.mttr}m` : "N/A" },
  ]

  return (
    <Layout>
      <DetailHeader
        title={heartbeat.name}
        subtitle={`Grace period: ${heartbeat.graceMinutes} minute${heartbeat.graceMinutes !== 1 ? "s" : ""}`}
        status={heartbeat.lastStatus}
        isPaused={heartbeat.isPaused}
        backUrl="/heartbeats"
        backLabel="Heartbeats"
        onEdit={() => setEditOpen(true)}
        onDelete={() => setDeleteOpen(true)}
        onPauseToggle={() => pauseMutation.mutate()}
        isPausePending={pauseMutation.isPending}
      />

      {/* Ping URL */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-sm">Ping URL</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded bg-muted px-3 py-2 text-xs break-all">{pingUrl}</code>
            <Button variant="outline" size="sm" onClick={copyUrl} className="cursor-pointer">
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Send a POST request to this URL from your cron job or script to signal it's alive.</p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-xl font-bold">{String(value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent pings */}
      {stats?.recentChecks && stats.recentChecks.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Recent Pings</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentChecks.slice(0, 10).map((c, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className={c.isUp ? "text-green-600" : "text-red-600"}>{c.isUp ? "Received" : "Missed"}</span>
                  <span className="text-muted-foreground">{formatDistanceToNow(new Date(c.timestamp), { addSuffix: true })}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <HeartbeatForm open={editOpen} onOpenChange={setEditOpen} item={heartbeat} />
      <DeleteConfirmDialog
        item={deleteOpen ? heartbeat : null}
        resourceType="heartbeat"
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setDeleteOpen(false)}
      />
    </Layout>
  )
}
