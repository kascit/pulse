import { useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { StatusDot } from "@/lib/status"
import { cn } from "@/lib/utils"

interface Props {
  id: string
  name: string
  type: string
  status?: string
  className?: string
}

const ROUTE: Record<string, string> = {
  Monitor: "/monitors",
  Heartbeat: "/heartbeats",
  AlertChannel: "/alerts/channels",
  AlertRule: "/alerts/rules",
  StatusPage: "/status-pages",
}

/** Shared clickable resource chip used in Dashboard, detail pages, log entries, etc. */
export function ResourceLink({ id, name, type, status, className }: Props) {
  const navigate = useNavigate()
  const base = ROUTE[type]

  return (
    <button
      type="button"
      onClick={base ? () => navigate(`${base}/${id}`) : undefined}
      className={cn(
        "inline-flex items-center gap-2 rounded-md px-2 py-1 text-left transition-colors",
        base ? "cursor-pointer hover:bg-muted" : "cursor-default",
        className
      )}
    >
      {status && <StatusDot status={status as any} />}
      <span className="text-sm font-medium">{name}</span>
      <Badge variant="secondary" className="text-xs capitalize">{type}</Badge>
    </button>
  )
}
