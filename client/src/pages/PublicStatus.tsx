import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { publicAPI } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"
import { Activity, Heart, PauseCircle } from "lucide-react"

const STATUS_COLOR: Record<string, string> = {
  up: "bg-green-500",
  down: "bg-red-500",
  degraded: "bg-yellow-500",
  unknown: "bg-gray-400",
}

const RESOURCE_ICON = { Monitor: Activity, Heartbeat: Heart }

export default function PublicStatus() {
  const { slug } = useParams<{ slug: string }>()

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-status", slug],
    queryFn: async () => (await publicAPI.getStatusPage(slug!)).data,
    enabled: !!slug,
  })

  if (isLoading) return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-3xl space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />)}
      </div>
    </div>
  )

  if (error || !data) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Status page not found</h1>
        <p className="mt-2 text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist.</p>
      </div>
    </div>
  )

  // Paused state — show a clean unavailable screen
  if (data.isPaused) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <PauseCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
        <h1 className="text-2xl font-bold">{data.name}</h1>
        <p className="mt-2 text-muted-foreground">This status page is temporarily unavailable.</p>
        <p className="mt-1 text-sm text-muted-foreground">Check back later.</p>
        <p className="mt-8 text-xs text-muted-foreground">
          Powered by <a href="/" className="underline hover:text-foreground">Pulse</a>
        </p>
      </div>
    </div>
  )

  const allUp = data.resources.every((r: any) => r.lastStatus === "up")
  const anyDown = data.resources.some((r: any) => r.lastStatus === "down")

  const overallStatus = allUp ? "All Systems Operational" : anyDown ? "Partial Outage" : "Checking..."
  const overallColor = allUp ? "bg-green-500" : anyDown ? "bg-red-500" : "bg-gray-400"

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold">{data.name}</h1>
          {data.description && <p className="mt-2 text-muted-foreground">{data.description}</p>}
          <div className="mt-6 flex items-center justify-center gap-3">
            <span className={`inline-flex h-4 w-4 rounded-full ${overallColor}`} />
            <span className="text-lg font-semibold">{overallStatus}</span>
          </div>
        </div>

        {/* Resources */}
        <div className="space-y-4">
          {data.resources.map((resource: any) => {
            const Icon = RESOURCE_ICON[resource.resourceType as keyof typeof RESOURCE_ICON] ?? Activity
            return (
              <div key={resource._id} className="rounded-xl border bg-card p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">{resource.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{resource.resourceType}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex h-2.5 w-2.5 rounded-full ${STATUS_COLOR[resource.lastStatus] ?? "bg-gray-400"}`} />
                    <span className="text-sm font-medium capitalize">{resource.lastStatus ?? "Unknown"}</span>
                  </div>
                </div>

                {/* Stats row */}
                {resource.stats && (
                  <div className="mt-4 flex gap-6 text-sm text-muted-foreground">
                    <span><strong className="text-foreground">{resource.stats.uptime}%</strong> uptime</span>
                    {resource.stats.avgLatency > 0 && (
                      <span><strong className="text-foreground">{resource.stats.avgLatency}ms</strong> avg</span>
                    )}
                    {resource.lastCheckedAt && (
                      <span>checked {formatDistanceToNow(new Date(resource.lastCheckedAt), { addSuffix: true })}</span>
                    )}
                  </div>
                )}

                {/* Mini check history */}
                {resource.recentChecks?.length > 0 && (
                  <div className="mt-3 flex gap-1">
                    {resource.recentChecks.slice(0, 20).reverse().map((c: any, i: number) => (
                      <div
                        key={i}
                        className={`h-6 w-2 rounded-sm ${c.isUp ? "bg-green-500" : "bg-red-500"}`}
                        title={c.isUp ? `Up — ${c.latencyMs}ms` : "Down"}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <p className="mt-12 text-center text-sm text-muted-foreground">
          Powered by <a href="/" className="underline hover:text-foreground">Pulse</a>
        </p>
      </div>
    </div>
  )
}
