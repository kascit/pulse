import { useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { ResourcePage } from "@/components/ResourcePage"
import { StatusPageForm } from "@/components/forms/StatusPageForm"
import { statusPagesAPI } from "@/lib/api"
import type { StatusPage } from "@/types"
import { Globe } from "lucide-react"

export default function StatusPages() {
  const navigate = useNavigate()

  return (
    <ResourcePage<StatusPage>
      title="Status Pages"
      description="Public pages showcasing the health of your resources"
      icon={Globe}
      queryKey="status-pages"
      fetchFn={statusPagesAPI.list}
      createDialog={StatusPageForm}
      createLabel="Status Page"
      searchFields={["name", "slug"]}
      onRowClick={(p) => navigate(`/status-pages/${p._id}`)}
      emptyText="Create a status page to share the health of your monitors and heartbeats with your users."
      statusFilters={[
        { label: "All", fn: () => true },
        { label: "Active", fn: (p) => !p.isPaused },
        { label: "Paused", fn: (p) => !!p.isPaused },
      ]}
      columns={[
        {
          key: "name",
          cell: (p) => (
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{p.name}</p>
                {p.isPaused && <Badge variant="secondary" className="text-xs">Paused</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">/status/{p.slug}</p>
              {p.description && <p className="mt-0.5 text-xs text-muted-foreground">{p.description}</p>}
            </div>
          ),
        },
        {
          key: "resources",
          header: "Resources",
          className: "hidden md:block",
          cell: (p) => (
            <span className="text-sm text-muted-foreground">
              {p.resources.length} resource{p.resources.length !== 1 ? "s" : ""}
            </span>
          ),
        },
      ]}
    />
  )
}
