import { Button } from "./button"
import { Badge } from "./badge"
import { StatusDot } from "@/lib/status"
import { ArrowLeft, Pause, Play, Pencil, Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface DetailHeaderProps {
  title: string
  subtitle?: React.ReactNode
  status?: "up" | "down" | "degraded" | "unknown" | "pending"
  isPaused?: boolean
  icon?: React.ReactNode
  badges?: React.ReactNode
  actions?: React.ReactNode
  backUrl: string
  backLabel: string
  onEdit?: () => void
  onDelete?: () => void
  onPauseToggle?: () => void
  isPausePending?: boolean
}

export function DetailHeader({
  title,
  subtitle,
  status,
  isPaused,
  icon,
  badges,
  actions,
  backUrl,
  backLabel,
  onEdit,
  onDelete,
  onPauseToggle,
  isPausePending,
}: DetailHeaderProps) {
  const navigate = useNavigate()

  return (
    <>
      <Button variant="ghost" onClick={() => navigate(backUrl)} className="mb-4 cursor-pointer gap-2">
        <ArrowLeft className="h-4 w-4" /> {backLabel}
      </Button>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {icon}
              </div>
            )}
            {status && <StatusDot status={status} size="md" />}
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {isPaused && <Badge variant="secondary">Paused</Badge>}
            {badges}
          </div>
          {subtitle && <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div>}
        </div>
        <div className="flex gap-2">
          {onPauseToggle && (
            <Button
              variant="outline"
              onClick={onPauseToggle}
              disabled={isPausePending}
              className="cursor-pointer gap-2"
            >
              {isPaused ? <><Play className="h-4 w-4" /> Resume</> : <><Pause className="h-4 w-4" /> Pause</>}
            </Button>
          )}
          {actions}
          {onEdit && (
            <Button variant="outline" onClick={onEdit} className="cursor-pointer gap-2">
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="destructive" onClick={onDelete} className="cursor-pointer gap-2">
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
        </div>
      </div>
    </>
  )
}
