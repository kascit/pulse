import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Layout } from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

// ─────────────────────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────────────────────

/** Single clickable/static row — the one shared row primitive used everywhere. */
export function ListRow({
  onClick,
  children,
  className,
}: {
  onClick?: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "group flex items-center justify-between rounded-lg border bg-card p-4 shadow-sm transition-all",
        onClick && "cursor-pointer hover:border-primary/40 hover:shadow-md hover:bg-muted/30",
        className
      )}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
    >
      <div className="min-w-0 flex-1">{children}</div>
      {onClick && (
        <ChevronRight className="ml-3 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Column / filter types
// ─────────────────────────────────────────────────────────────────────────────

export interface Column<T> {
  key: string
  header?: string
  cell: (item: T) => React.ReactNode
  className?: string
}

export interface StatusFilter<T> {
  label: string
  fn: (item: T) => boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// ResourceList — fetch + search + filter + render. No Layout wrapper.
// Used directly inside Alerts tabs and wrapped by ResourcePage for full pages.
// ─────────────────────────────────────────────────────────────────────────────

export interface ResourceListProps<T extends { _id: string }> {
  queryKey: string
  fetchFn: () => Promise<{ data: T[] }>
  columns: Column<T>[]
  onRowClick?: (item: T) => void
  searchFields?: (keyof T)[]
  statusFilters?: StatusFilter<T>[]
  filterFn?: (item: T) => boolean
  emptyIcon?: LucideIcon
  emptyTitle?: string
  emptyText?: string
  emptyAction?: React.ReactNode
}

export function ResourceList<T extends { _id: string }>({
  queryKey,
  fetchFn,
  columns,
  onRowClick,
  searchFields = [],
  statusFilters,
  filterFn,
  emptyIcon: EmptyIcon,
  emptyTitle = "Nothing here yet",
  emptyText,
  emptyAction,
}: ResourceListProps<T>) {
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState(0)

  const { data: allItems = [], isLoading } = useQuery<T[]>({
    queryKey: [queryKey],
    queryFn: async () => (await fetchFn()).data,
  })

  const base = filterFn ? allItems.filter(filterFn) : allItems
  const statusFiltered = statusFilters?.[activeFilter] ? base.filter(statusFilters[activeFilter].fn) : base
  const items =
    search && searchFields.length
      ? statusFiltered.filter((item) =>
          searchFields.some((f) => String((item as any)[f] ?? "").toLowerCase().includes(search.toLowerCase()))
        )
      : statusFiltered

  return (
    <>
      {/* Search + filter pills */}
      {(searchFields.length > 0 || (statusFilters && statusFilters.length > 1)) && (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          {searchFields.length > 0 && (
            <div className="relative max-w-sm flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
          {statusFilters && statusFilters.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {statusFilters.map((f, i) => (
                <button
                  key={f.label}
                  onClick={() => setActiveFilter(i)}
                  className={cn(
                    "cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    activeFilter === i
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center">
          {EmptyIcon && <EmptyIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />}
          <h3 className="mb-1 text-lg font-medium">{emptyTitle}</h3>
          {emptyText && <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground">{emptyText}</p>}
          {emptyAction}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <ListRow key={item._id} onClick={onRowClick ? () => onRowClick(item) : undefined}>
              <div className={columns.length === 1 ? "w-full" : "grid gap-2 md:grid-cols-4"}>
                {columns.map((col) => (
                  <div key={col.key} className={col.className ?? (columns.length > 1 ? undefined : "w-full")}>
                    {col.header && (
                      <span className="mb-1 block text-xs text-muted-foreground">{col.header}</span>
                    )}
                    {col.cell(item)}
                  </div>
                ))}
              </div>
            </ListRow>
          ))}
        </div>
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ResourcePage — Layout + header + create button + ResourceList
// ─────────────────────────────────────────────────────────────────────────────

interface ResourcePageProps<T extends { _id: string }> extends ResourceListProps<T> {
  title: string
  description: string
  icon: LucideIcon
  createDialog?: React.ComponentType<{ open: boolean; onOpenChange: (o: boolean) => void; item?: T | null }>
  createLabel?: string
}

export function ResourcePage<T extends { _id: string }>({
  title,
  description,
  icon: Icon,
  createDialog: CreateDialog,
  createLabel,
  emptyIcon,
  emptyTitle,
  emptyText,
  ...listProps
}: ResourcePageProps<T>) {
  const [createOpen, setCreateOpen] = useState(false)
  const label = createLabel ?? title.replace(/s$/, "")

  return (
    <Layout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-muted-foreground">{description}</p>
        </div>
        {CreateDialog && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add {label}
          </Button>
        )}
      </div>

      <ResourceList<T>
        {...listProps}
        emptyIcon={emptyIcon ?? Icon}
        emptyTitle={emptyTitle ?? `No ${title.toLowerCase()} yet`}
        emptyText={emptyText}
        emptyAction={CreateDialog ? <Button onClick={() => setCreateOpen(true)}>Add {label}</Button> : undefined}
      />

      {CreateDialog && (
        <CreateDialog
          open={createOpen}
          onOpenChange={(open) => {
            if (!open) setCreateOpen(false)
          }}
          item={null}
        />
      )}
    </Layout>
  )
}
