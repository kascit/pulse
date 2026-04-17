import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"

export interface MultiSelectItem {
  _id: string
  name: string
  subLabel?: string
}

interface Props {
  items: MultiSelectItem[]
  selected: string[]
  onAdd: (id: string) => void
  onRemove: (id: string) => void
  placeholder?: string
}

/** Shared search+dropdown multi-select. Used in AlertRuleForm and StatusPageForm. */
export function MultiSelect({ items, selected, onAdd, onRemove, placeholder = "Search…" }: Props) {
  const [q, setQ] = useState("")
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = items.filter(
    (i) => !selected.includes(i._id) && i.name.toLowerCase().includes(q.toLowerCase())
  )
  const selectedItems = items.filter((i) => selected.includes(i._id))

  // Close on outside click and reset query
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQ("")
      }
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  return (
    <div className="space-y-2">
      <div ref={ref} className="relative">
        <Input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
        />
        {open && (
          <div className="absolute z-50 mt-1 max-h-44 w-full overflow-y-auto rounded-lg border bg-popover shadow-lg">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                {items.filter(i => !selected.includes(i._id)).length === 0
                  ? "All items selected"
                  : "No matches"}
              </p>
            ) : filtered.map((item) => (
              <button
                key={item._id}
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                onMouseDown={(e) => {
                  e.preventDefault() // keeps input focused, dropdown stays open
                  onAdd(item._id)
                  setQ("") // clear search so the full remaining list shows immediately
                }}
              >
                <span>{item.name}</span>
                {item.subLabel && <span className="text-xs text-muted-foreground">{item.subLabel}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedItems.map((item) => (
            <Badge key={item._id} variant="secondary" className="gap-1 pr-1">
              {item.name}
              {item.subLabel && <span className="text-xs opacity-60">· {item.subLabel}</span>}
              <button
                type="button"
                onClick={() => onRemove(item._id)}
                className="ml-0.5 rounded hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
