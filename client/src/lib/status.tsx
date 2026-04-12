import { cn } from "@/lib/utils"

export const STATUS_BG: Record<string, string> = {
  up: "bg-green-500",
  down: "bg-red-500",
  degraded: "bg-yellow-500",
  unknown: "bg-gray-400",
  pending: "bg-gray-400",
}

export const STATUS_TEXT: Record<string, string> = {
  up: "text-green-600",
  down: "text-red-600",
  degraded: "text-yellow-600",
  unknown: "text-gray-500",
  pending: "text-gray-500",
}

export function StatusDot({
  status,
  size = "sm",
  className,
}: {
  status?: string
  size?: "sm" | "md"
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full",
        STATUS_BG[status ?? "unknown"] ?? "bg-gray-400",
        size === "sm" ? "h-2 w-2" : "h-3 w-3",
        className
      )}
    />
  )
}
