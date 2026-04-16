import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Layout } from "@/components/Layout"
import { AlertChannelForm } from "@/components/forms/AlertChannelForm"
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog"
import { alertChannelsAPI } from "@/lib/api"
import type { AlertChannel } from "@/types"
import { DetailHeader } from "@/components/ui/DetailHeader"
import { Webhook, Send } from "lucide-react"
import { toast } from "sonner"

const ICONS = { webhook: Webhook, telegram: Send }
const LABELS = { webhook: "Webhook", telegram: "Telegram" }

export default function AlertChannelDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const deleteMutation = useMutation({
    mutationFn: () => alertChannelsAPI.remove(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alert-channels"] })
      toast.success("Channel deleted")
      navigate("/alerts")
    },
    onError: () => toast.error("Failed to delete channel"),
  })

  const { data: channel, isLoading } = useQuery<AlertChannel>({
    queryKey: ["alert-channels", id],
    queryFn: async () => (await alertChannelsAPI.get(id!)).data,
    enabled: !!id,
  })

  if (isLoading) return <Layout><div className="h-48 animate-pulse rounded-lg bg-muted" /></Layout>
  if (!channel) return (
    <Layout>
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold">Channel not found</h1>
        <Button className="mt-4" variant="outline" onClick={() => navigate("/alerts")}>Back to Alerts</Button>
      </div>
    </Layout>
  )

  const Icon = ICONS[channel.type]

  return (
    <Layout>
      <DetailHeader
        title={channel.name}
        subtitle="Alert channel"
        icon={<Icon className="h-6 w-6" />}
        badges={
          <>
            <Badge variant="secondary">{LABELS[channel.type]}</Badge>
            {!channel.enabled && <Badge variant="outline">Disabled</Badge>}
          </>
        }
        backUrl="/alerts"
        backLabel="Alerts"
        onEdit={() => setEditOpen(true)}
        onDelete={() => setDeleteOpen(true)}
      />

      <Card>
        <CardHeader><CardTitle className="text-sm">Configuration</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type</span>
            <span>{LABELS[channel.type]}</span>
          </div>
          {channel.type === "webhook" && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">URL</span>
              <span className="max-w-xs truncate font-mono text-xs">{channel.config.url}</span>
            </div>
          )}

          {channel.type === "telegram" && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Chat ID</span>
                <span>{channel.config.chatId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bot Token</span>
                <span className="font-mono text-xs">{"•".repeat(20)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={channel.enabled ? "default" : "outline"}>{channel.enabled ? "Active" : "Disabled"}</Badge>
          </div>
        </CardContent>
      </Card>

      <AlertChannelForm open={editOpen} onOpenChange={setEditOpen} item={channel} />
      <DeleteConfirmDialog
        item={deleteOpen ? channel : null}
        resourceType="alert channel"
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setDeleteOpen(false)}
      />
    </Layout>
  )
}
