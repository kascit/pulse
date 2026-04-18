import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Layout } from "@/components/Layout"
import { logsAPI } from "@/lib/api"
import type { Log } from "@/types"
import { format } from "date-fns"
import { ArrowLeft } from "lucide-react"
import { ResourceLink } from "@/components/ResourceLink"
import { EVENT_CONFIG, DEFAULT_EVENT } from "@/lib/events"

export default function LogDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: log, isLoading } = useQuery<Log>({
    queryKey: ["logs", id],
    queryFn: async () => (await logsAPI.get(id!)).data,
    enabled: !!id,
  })

  if (isLoading) return (
    <Layout>
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
      </div>
    </Layout>
  )

  if (!log) return (
    <Layout>
      <div className="py-16 text-center">
        <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
        <h1 className="text-2xl font-bold">Log not found</h1>
        <Button className="mt-4" variant="outline" onClick={() => navigate("/logs")}>Back to Logs</Button>
      </div>
    </Layout>
  )

  const cfg = EVENT_CONFIG[log.event] ?? DEFAULT_EVENT
  const Icon = cfg.icon
  const meta = log.metadata ? Object.entries(log.metadata).filter(([, v]) => v != null) : []

  return (
    <Layout>
      <Button variant="ghost" onClick={() => navigate("/logs")} className="mb-4 gap-2">
        <ArrowLeft className="h-4 w-4" /> Logs
      </Button>

      <div className="mb-8 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
          <Icon className={`h-6 w-6 ${cfg.color}`} />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{log.message}</h1>
            <Badge variant="outline">{cfg.label}</Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <ResourceLink id={log.resourceId} name={log.resourceName} type={log.resourceType} />
            <span>·</span>
            <span>{format(new Date(log.timestamp), "MMM d, yyyy 'at' HH:mm:ss")}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Event Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Event type</span>
              <code className="text-xs">{log.event}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Resource</span>
              <span className="font-medium">{log.resourceName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Resource type</span>
              <Badge variant="secondary" className="text-xs capitalize">{log.resourceType}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Timestamp</span>
              <span>{format(new Date(log.timestamp), "HH:mm:ss, MMM d yyyy")}</span>
            </div>
          </CardContent>
        </Card>

        {meta.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Metadata</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {meta.map(([key, value]) => (
                <div key={key} className="flex justify-between gap-4">
                  <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                  <span className="font-mono text-xs">{String(value)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}
