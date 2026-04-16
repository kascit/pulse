import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertChannelForm } from "@/components/forms/AlertChannelForm"
import { AlertRuleForm } from "@/components/forms/AlertRuleForm"
import { ResourceList } from "@/components/ResourcePage"
import { alertChannelsAPI, alertRulesAPI } from "@/lib/api"
import type { AlertChannel, AlertRule } from "@/types"
import { useNavigate } from "react-router-dom"
import { Bell, Webhook, Send, Zap } from "lucide-react"
import { Layout } from "@/components/Layout"

const CHANNEL_ICONS: any = { webhook: Webhook, telegram: Send }
const CHANNEL_LABELS: Record<string, string> = { webhook: "Webhook", telegram: "Telegram" }

export default function Alerts() {
  const navigate = useNavigate()
  const [tab, setTab] = useState("rules")
  const [channelOpen, setChannelOpen] = useState(false)
  const [ruleOpen, setRuleOpen] = useState(false)

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
        <p className="mt-1 text-muted-foreground">
          Configure notification channels and rules to get notified when resources fail
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
        </TabsList>

        {/* ── Channels ── */}
        <TabsContent value="channels">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Notification Channels</h2>
              <p className="text-sm text-muted-foreground">Where to send alerts — webhooks or Telegram</p>
            </div>
            <Button onClick={() => setChannelOpen(true)}>
              <Bell className="mr-2 h-4 w-4" /> Add Channel
            </Button>
          </div>

          <ResourceList<AlertChannel>
            queryKey="alert-channels"
            fetchFn={alertChannelsAPI.list as any}
            onRowClick={(ch) => navigate(`/alerts/channels/${ch._id}`)}
            emptyIcon={Bell}
            emptyTitle="No channels yet"
            emptyText="Add a webhook or Telegram bot to receive alerts"
            emptyAction={<Button onClick={() => setChannelOpen(true)}>Add Channel</Button>}
            columns={[
              {
                key: "info",
                cell: (ch) => {
                  const Icon = CHANNEL_ICONS[ch.type] ?? Bell
                  return (
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{ch.name}</span>
                          <Badge variant="secondary">{CHANNEL_LABELS[ch.type]}</Badge>
                          {!ch.enabled && <Badge variant="outline">Disabled</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {ch.config.url || "Telegram bot"}
                        </p>
                      </div>
                    </div>
                  )
                },
              },
            ]}
          />
          <AlertChannelForm open={channelOpen} onOpenChange={setChannelOpen} />
        </TabsContent>

        {/* ── Rules ── */}
        <TabsContent value="rules">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Alert Rules</h2>
              <p className="text-sm text-muted-foreground">Define which resources to watch and when to fire a channel</p>
            </div>
            <Button onClick={() => setRuleOpen(true)}>
              <Zap className="mr-2 h-4 w-4" /> Add Rule
            </Button>
          </div>

          <ResourceList<AlertRule>
            queryKey="alert-rules"
            fetchFn={alertRulesAPI.list as any}
            onRowClick={(rule) => navigate(`/alerts/rules/${rule._id}`)}
            statusFilters={[
              { label: "All", fn: () => true },
              { label: "Active", fn: (r) => r.enabled },
              { label: "Paused", fn: (r) => !r.enabled },
            ]}
            emptyIcon={Zap}
            emptyTitle="No rules yet"
            emptyText="Rules connect your resources to channels — create a channel first"
            emptyAction={<Button onClick={() => setRuleOpen(true)}>Add Rule</Button>}
            columns={[
              {
                key: "info",
                cell: (rule) => {
                  const channels = rule.channelIds as AlertChannel[] | string[]
                  const channelNames = channels
                    .filter((c): c is AlertChannel => typeof c === "object")
                    .map((c) => c.name)
                    .join(", ") || "—"
                  const resourceCount = rule.resources.length
                  return (
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{rule.name}</span>
                        {!rule.enabled && <Badge variant="outline">Paused</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Watching {resourceCount} resource{resourceCount !== 1 ? "s" : ""} →{" "}
                        <span className="font-medium">{channelNames}</span>
                        {rule.triggers.latencyMs && ` • latency ≥ ${rule.triggers.latencyMs}ms`}
                      </p>
                    </div>
                  )
                },
              },
            ]}
          />
          <AlertRuleForm open={ruleOpen} onOpenChange={setRuleOpen} />
        </TabsContent>
      </Tabs>
    </Layout>
  )
}
