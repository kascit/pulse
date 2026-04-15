import { useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { ResourcePage } from "@/components/ResourcePage"
import { HeartbeatForm } from "@/components/forms/HeartbeatForm"
import { heartbeatsAPI } from "@/lib/api"
import { StatusDot } from "@/lib/status"
import type { Heartbeat } from "@/types"
import { formatDistanceToNow } from "date-fns"
import { Heart } from "lucide-react"

const isHbUp = (hb: Heartbeat) =>
  !hb.isPaused && !!hb.lastPingedAt &&
  Date.now() - new Date(hb.lastPingedAt).getTime() <= hb.graceMinutes * 60000

const isHbDown = (hb: Heartbeat) =>
  !hb.isPaused && !!hb.lastPingedAt &&
  Date.now() - new Date(hb.lastPingedAt).getTime() > hb.graceMinutes * 60000

const getStatus = (hb: Heartbeat) => {
  if (hb.isPaused) return "paused"
  if (!hb.lastPingedAt) return "waiting"
  return isHbUp(hb) ? "up" : "down"
}

export default function Heartbeats() {
  const navigate = useNavigate()

  return (
    <ResourcePage<Heartbeat>
      title="Heartbeats"
      description="Passive monitors — your services ping Pulse to prove they're alive"
      icon={Heart}
      queryKey="heartbeats"
      fetchFn={heartbeatsAPI.list}
      createDialog={HeartbeatForm}
      createLabel="Heartbeat"
      searchFields={["name"]}
      emptyText="Heartbeats wait for pings from your cron jobs and scripts. If no ping arrives within the grace period, the heartbeat goes down."
      onRowClick={(hb) => navigate(`/heartbeats/${hb._id}`)}
      statusFilters={[
        { label: "All", fn: () => true },
        { label: "Up", fn: isHbUp },
        { label: "Down", fn: isHbDown },
        { label: "Waiting", fn: (hb) => !hb.isPaused && !hb.lastPingedAt },
        { label: "Paused", fn: (hb) => !!hb.isPaused },
      ]}
      columns={[
        {
          key: "name",
          cell: (hb) => {
            const status = getStatus(hb)
            return (
              <div>
                <div className="flex items-center gap-2">
                  <StatusDot status={status === "waiting" || status === "paused" ? "unknown" : status} />
                  <span className="font-medium">{hb.name}</span>
                  {status === "waiting" && <Badge variant="outline" className="text-xs">Waiting</Badge>}
                  {hb.isPaused && <Badge variant="secondary" className="text-xs">Paused</Badge>}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">Grace: {hb.graceMinutes}m</p>
              </div>
            )
          },
        },
        {
          key: "lastPing",
          header: "Last Ping",
          className: "hidden md:block",
          cell: (hb) => (
            <span className="text-sm text-muted-foreground">
              {hb.lastPingedAt ? formatDistanceToNow(new Date(hb.lastPingedAt), { addSuffix: true }) : "Never"}
            </span>
          ),
        },
      ]}
    />
  )
}
