import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { Layout } from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ListRow } from "@/components/ResourcePage"
import { logsAPI } from "@/lib/api"
import type { Log } from "@/types"
import { formatDistanceToNow } from "date-fns"
import { ChevronLeft, ChevronRight, Search, FileText, RefreshCw } from "lucide-react"
import { EVENT_CONFIG, DEFAULT_EVENT } from "@/lib/events"
import { cn } from "@/lib/utils"

const LIMIT = 20

const FILTERS = [
  { label: "All", value: "all" },
  { label: "Down", value: "resource.down" },
  { label: "Up", value: "resource.up" },
  { label: "Alert", value: "alert.fired" },
  { label: "Created", value: "resource.created" },
  { label: "Deleted", value: "resource.deleted" },
]

export default function Logs() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [eventFilter, setEventFilter] = useState("all")
  const [search, setSearch] = useState("")

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["logs", page, eventFilter],
    queryFn: async () =>
      (await logsAPI.list({ limit: LIMIT, page, ...(eventFilter !== "all" ? { event: eventFilter } : {}) })).data,
    placeholderData: keepPreviousData,
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["logs", page, eventFilter] })

  const logs: Log[] = data?.logs ?? []
  const total: number = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  const filtered = search
    ? logs.filter((l) =>
        l.message.toLowerCase().includes(search.toLowerCase()) ||
        l.resourceName.toLowerCase().includes(search.toLowerCase())
      )
    : logs

  const handleFilterChange = (val: string) => {
    setEventFilter(val)
    setPage(1)
  }

  return (
    <Layout>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logs</h1>
          <p className="mt-1 text-muted-foreground">Activity log for all your resources — status changes, alerts, and lifecycle events</p>
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

      {/* Search + filter pills */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search logs…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => handleFilterChange(f.value)}
              className={cn(
                "cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors",
                eventFilter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="text-lg font-medium">No logs found</h3>
          <p className="mt-1 text-sm text-muted-foreground">Events are recorded automatically when resources change status</p>
        </div>
      ) : (
        <div className="space-y-2">
            {filtered.map((log) => {
            const cfg = EVENT_CONFIG[log.event] ?? DEFAULT_EVENT
            const Icon = cfg.icon
            return (
              <ListRow key={log._id} onClick={() => navigate(`/logs/${log._id}`)}>
                <div className="flex items-start gap-3">
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${cfg.color}`} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{log.message}</p>
                      <Badge variant="outline" className="text-xs">{cfg.label}</Badge>
                      <Badge variant="secondary" className="text-xs capitalize">{log.resourceType}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </ListRow>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page} of {totalPages} · {total} entries</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Prev
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Layout>
  )
}
