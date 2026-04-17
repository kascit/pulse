import { useId } from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

interface Props {
  label: React.ReactNode
  error?: string
  className?: string
  children: React.ReactNode
}

/**
 * Accessible form field wrapper — auto-generates an id and passes it
 * to the Label (htmlFor) and injects it into the child input via cloneElement.
 */
export function FormField({ label, error, className, children }: Props) {
  const id = useId()
  const child = children as React.ReactElement<any>
  const inputEl = child?.props !== undefined
    ? { ...child, props: { ...child.props, id: child.props.id ?? id } }
    : child

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={child?.props?.id ?? id}>{label}</Label>
      {inputEl}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
