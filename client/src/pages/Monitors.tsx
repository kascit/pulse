import { useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { ResourcePage } from "@/components/ResourcePage"
import { MonitorForm } from "@/components/forms/MonitorForm"
import { monitorsAPI } from "@/lib/api"
import { StatusDot } from "@/lib/status"
import type { Monitor } from "@/types"
import { formatDistanceToNow } from "date-fns"
import { Activity } from "lucide-react"

export default function Monitors() {
  const navigate = useNavigate()

  return (
    <ResourcePage<Monitor>
      title="Monitors"
      description="Active HTTP/S checks on your endpoints at configurable intervals"
      icon={Activity}
      queryKey="monitors"
      fetchFn={monitorsAPI.list}
      createDialog={MonitorForm}
      createLabel="Monitor"
      searchFields={["name", "url"]}
      emptyText="Monitors actively check your URLs and APIs at set intervals. Create one to start tracking uptime."
      onRowClick={(m) => navigate(`/monitors/${m._id}`)}
      statusFilters={[
        { label: "All", fn: () => true },
        { label: "Up", fn: (m) => m.lastStatus === "up" && !m.isPaused },
        { label: "Down", fn: (m) => m.lastStatus === "down" && !m.isPaused },
        { label: "Paused", fn: (m) => !!m.isPaused },
      ]}
      columns={[
        {
          key: "name",
          cell: (m) => (
            <div>
              <div className="flex items-center gap-2">
                <StatusDot status={m.isPaused ? "unknown" : m.lastStatus} />
                <span className="font-medium">{m.name}</span>
                {m.isPaused && <Badge variant="secondary" className="text-xs">Paused</Badge>}
              </div>
              <p className="mt-0.5 max-w-xs truncate text-sm text-muted-foreground">{m.url}</p>
              {m.tags?.length > 0 && (
                <div className="mt-1 flex gap-1">
                  {m.tags.slice(0, 3).map((t) => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                </div>
              )}
            </div>
          ),
        },
        {
          key: "interval",
          header: "Interval",
          className: "hidden md:block",
          cell: (m) => <span className="text-sm">{m.intervalMinutes}m</span>,
        },
        {
          key: "lastCheck",
          header: "Last Check",
          className: "hidden lg:block",
          cell: (m) => (
            <span className="text-sm text-muted-foreground">
              {m.lastCheckedAt ? formatDistanceToNow(new Date(m.lastCheckedAt), { addSuffix: true }) : "Never"}
            </span>
          ),
        },
      ]}
    />
  )
}
