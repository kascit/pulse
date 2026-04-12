import { CheckCircle, AlertCircle, Bell, PlusCircle, MinusCircle, Activity } from "lucide-react"

/** Shared event config used by Dashboard, Logs page, and LogDetail. */
export const EVENT_CONFIG: Record<string, { icon: typeof Bell; color: string; label: string }> = {
  "resource.created": { icon: PlusCircle, color: "text-blue-500", label: "Created" },
  "resource.deleted": { icon: MinusCircle, color: "text-muted-foreground", label: "Deleted" },
  "resource.up": { icon: CheckCircle, color: "text-green-600", label: "Up" },
  "resource.down": { icon: AlertCircle, color: "text-red-600", label: "Down" },
  "resource.degraded": { icon: AlertCircle, color: "text-yellow-600", label: "Degraded" },
  "alert.fired": { icon: Bell, color: "text-blue-600", label: "Alert" },
  "check.failed": { icon: AlertCircle, color: "text-orange-600", label: "Check Failed" },
}

export const DEFAULT_EVENT = { icon: Activity, color: "text-muted-foreground", label: "Event" }
