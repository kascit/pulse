import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Layout } from "@/components/Layout"
import { AlertRuleForm } from "@/components/forms/AlertRuleForm"
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog"
import { ResourceLink } from "@/components/ResourceLink"
import { alertRulesAPI } from "@/lib/api"
import type { AlertRule, AlertChannel, ResourceBase } from "@/types"
import { DetailHeader } from "@/components/ui/DetailHeader"
import { Zap } from "lucide-react"
import { toast } from "sonner"

export default function AlertRuleDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const deleteMutation = useMutation({
    mutationFn: () => alertRulesAPI.remove(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alert-rules"] })
      toast.success("Rule deleted")
      navigate("/alerts")
    },
    onError: () => toast.error("Failed to delete rule"),
  })

  const pauseMutation = useMutation({
    mutationFn: () => alertRulesAPI.update(id!, { enabled: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alert-rules", id] })
      queryClient.invalidateQueries({ queryKey: ["alert-rules"] })
      toast.success("Rule paused")
    },
    onError: () => toast.error("Failed to pause rule"),
  })

  const resumeMutation = useMutation({
    mutationFn: () => alertRulesAPI.update(id!, { enabled: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alert-rules", id] })
      queryClient.invalidateQueries({ queryKey: ["alert-rules"] })
      toast.success("Rule resumed")
    },
    onError: () => toast.error("Failed to resume rule"),
  })

  const { data: rule, isLoading } = useQuery<AlertRule>({
    queryKey: ["alert-rules", id],
    queryFn: async () => (await alertRulesAPI.get(id!)).data,
    enabled: !!id,
  })

  if (isLoading) return <Layout><div className="h-48 animate-pulse rounded-lg bg-muted" /></Layout>
  if (!rule) return (
    <Layout>
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold">Rule not found</h1>
        <Button className="mt-4" variant="outline" onClick={() => navigate("/alerts")}>Back to Alerts</Button>
      </div>
    </Layout>
  )

  const channels = rule.channelIds as AlertChannel[]
  const resources = rule.resources as ResourceBase[]

  return (
    <Layout>
      <DetailHeader
        title={rule.name}
        subtitle="Alert rule"
        icon={<Zap className="h-6 w-6" />}
        isPaused={!rule.enabled}
        backUrl="/alerts"
        backLabel="Alerts"
        onEdit={() => setEditOpen(true)}
        onDelete={() => setDeleteOpen(true)}
        onPauseToggle={() => rule.enabled ? pauseMutation.mutate() : resumeMutation.mutate()}
        isPausePending={pauseMutation.isPending || resumeMutation.isPending}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Triggers</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">On resource down</span>
              <Badge variant="default">Always</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">On recovery</span>
              <Badge variant="default">Always</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Latency threshold</span>
              <span>{rule.triggers.latencyMs ? `≥ ${rule.triggers.latencyMs}ms` : "Disabled"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Channels ({channels.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {channels.length === 0 ? (
              <p className="text-sm text-muted-foreground">No channels</p>
            ) : channels.map((ch) => (
              <div key={typeof ch === "object" ? ch._id : ch}>
                {typeof ch === "object" ? (
                  <ResourceLink id={ch._id} name={ch.name} type="AlertChannel" />
                ) : (
                  <span className="text-sm text-muted-foreground">{ch}</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-sm">Watched Resources ({resources.length})</CardTitle></CardHeader>
          <CardContent>
            {resources.length === 0 ? (
              <p className="text-sm text-muted-foreground">No resources selected</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {resources.map((r) => (
                  typeof r === "object"
                    ? <ResourceLink key={r._id} id={r._id} name={r.name} type={r.resourceType} status={r.lastStatus} />
                    : <span key={r} className="text-sm">{r}</span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertRuleForm open={editOpen} onOpenChange={setEditOpen} item={rule} />
      <DeleteConfirmDialog
        item={deleteOpen ? rule : null}
        resourceType="alert rule"
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setDeleteOpen(false)}
      />
    </Layout>
  )
}
