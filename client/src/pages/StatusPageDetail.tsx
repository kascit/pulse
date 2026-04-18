import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Layout } from "@/components/Layout"
import { StatusPageForm } from "@/components/forms/StatusPageForm"
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog"
import { statusPagesAPI } from "@/lib/api"
import type { StatusPage, ResourceBase } from "@/types"
import { DetailHeader } from "@/components/ui/DetailHeader"
import { Globe, ExternalLink, Copy, Check } from "lucide-react"
import { ResourceLink } from "@/components/ResourceLink"
import { toast } from "sonner"

const STATUS_COLOR: Record<string, string> = { up: "bg-green-500", down: "bg-red-500", degraded: "bg-yellow-500", unknown: "bg-gray-400" }

export default function StatusPageDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: page, isLoading } = useQuery<StatusPage>({
    queryKey: ["status-pages", id],
    queryFn: async () => (await statusPagesAPI.get(id!)).data,
    enabled: !!id,
  })

  const publicUrl = page ? `${window.location.origin}/status/${page.slug}` : ""

  const pauseMutation = useMutation({
    mutationFn: () => {
      const resourceIds = (page!.resources as any[]).map((r) =>
        typeof r === "object" ? r._id : r
      )
      return statusPagesAPI.update(id!, { isPaused: !page?.isPaused, resources: resourceIds })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["status-pages", id] })
      queryClient.invalidateQueries({ queryKey: ["status-pages"] })
      toast.success(page?.isPaused ? "Status page resumed" : "Status page paused")
    },
    onError: () => toast.error("Failed to update status page"),
  })

  const deleteMutation = useMutation({
    mutationFn: () => statusPagesAPI.remove(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["status-pages"] })
      toast.success("Status page deleted")
      navigate("/status-pages")
    },
    onError: () => toast.error("Failed to delete status page"),
  })

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    toast.success("Public link copied")
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) return <Layout><div className="h-48 animate-pulse rounded-lg bg-muted" /></Layout>
  if (!page) return (
    <Layout>
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold">Status page not found</h1>
        <Button className="mt-4" variant="outline" onClick={() => navigate("/status-pages")}>Back</Button>
      </div>
    </Layout>
  )

  const resources = page.resources as ResourceBase[]

  return (
    <Layout>
      <DetailHeader
        title={page.name}
        subtitle={page.description}
        icon={<Globe className="h-6 w-6" />}
        isPaused={page.isPaused}
        backUrl="/status-pages"
        backLabel="Status Pages"
        onEdit={() => setEditOpen(true)}
        onDelete={() => setDeleteOpen(true)}
        onPauseToggle={() => pauseMutation.mutate()}
        isPausePending={pauseMutation.isPending}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={copyLink}>
              {copied ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
              Copy link
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open(publicUrl, "_blank")}>
              <ExternalLink className="mr-2 h-4 w-4" /> View public page
            </Button>
          </>
        }
      />

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-sm">Public URL</CardTitle></CardHeader>
        <CardContent>
          <code className="rounded bg-muted px-3 py-2 text-sm">{publicUrl}</code>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Resources on this page ({resources.length})</CardTitle></CardHeader>
        <CardContent>
          {resources.length === 0 ? (
            <p className="text-sm text-muted-foreground">No resources added yet. Edit the page to add monitors or heartbeats.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {resources.map((r) => (
                typeof r === "object"
                  ? <ResourceLink key={r._id} id={r._id} name={r.name} type={r.resourceType} status={r.lastStatus} />
                  : <span key={r} className="text-sm text-muted-foreground">{r}</span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <StatusPageForm open={editOpen} onOpenChange={setEditOpen} item={page} />
      <DeleteConfirmDialog
        item={deleteOpen ? page : null}
        resourceType="status page"
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setDeleteOpen(false)}
      />
    </Layout>
  )
}
