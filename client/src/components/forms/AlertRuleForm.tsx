import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQuery } from "@tanstack/react-query"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormDialog } from "./FormDialog"
import { FormField } from "./FormField"
import { MultiSelect } from "./MultiSelect"
import { alertRulesAPI, alertChannelsAPI, monitorsAPI, heartbeatsAPI } from "@/lib/api"
import { useResourceMutation } from "@/hooks/useResourceMutation"
import type { AlertRule, AlertChannel, Monitor, Heartbeat } from "@/types"

const schema = z.object({
  name: z.string().min(1, "Name required"),
  channelIds: z.array(z.string()).min(1, "Select at least one channel"),
  resources: z.array(z.string()).min(1, "Select at least one resource"),
  latencyMs: z.string().optional(),
})

type FormData = z.infer<typeof schema>
const DEFAULTS: FormData = { name: "", channelIds: [], resources: [], latencyMs: "" }

interface Props { open: boolean; onOpenChange: (o: boolean) => void; item?: AlertRule | null }

export function AlertRuleForm({ open, onOpenChange, item }: Props) {
  const isEdit = !!item

  const { data: channels = [] } = useQuery<AlertChannel[]>({ queryKey: ["alert-channels"], queryFn: async () => (await alertChannelsAPI.list()).data })
  const { data: monitors = [] } = useQuery<Monitor[]>({ queryKey: ["monitors"], queryFn: async () => (await monitorsAPI.list()).data })
  const { data: heartbeats = [] } = useQuery<Heartbeat[]>({ queryKey: ["heartbeats"], queryFn: async () => (await heartbeatsAPI.list()).data })

  const channelItems = channels.map((c) => ({ _id: c._id, name: c.name, subLabel: c.type }))
  const resourceItems = [
    ...monitors.map((m) => ({ _id: m._id, name: m.name, subLabel: "Monitor" })),
    ...heartbeats.map((h) => ({ _id: h._id, name: h.name, subLabel: "Heartbeat" })),
  ]

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  })

  const selectedChannelIds = watch("channelIds")
  const selectedResourceIds = watch("resources")

  useEffect(() => {
    if (item) {
      const cIds = (item.channelIds as any[]).map((c) => typeof c === "object" ? c._id : c)
      const rIds = item.resources.map((r) => typeof r === "object" ? (r as any)._id : r)
      reset({ name: item.name, channelIds: cIds, resources: rIds, latencyMs: item.triggers.latencyMs ? String(item.triggers.latencyMs) : "" })
    } else {
      reset(DEFAULTS)
    }
  }, [item, open, reset])

  const mutation = useResourceMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        name: data.name,
        channelIds: data.channelIds,
        resources: data.resources,
        triggers: { latencyMs: data.latencyMs ? Number(data.latencyMs) : null },
      }
      return isEdit ? alertRulesAPI.update(item._id, payload) : alertRulesAPI.create(payload)
    },
    invalidateQueryKeys: [["alert-rules"]],
    successText: isEdit ? "Rule updated" : "Rule created",
    close: () => onOpenChange(false),
  })

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit Rule" : "Create Alert Rule"}
      description="Fires when a watched resource goes down, and again when it recovers."
      onSubmit={handleSubmit((d) => mutation.mutate(d))}
      isPending={mutation.isPending}
      submitLabel={isEdit ? "Save changes" : "Create rule"}
    >
      <FormField label="Rule name" error={errors.name?.message}>
        <Input {...register("name")} placeholder="API down alert" autoComplete="off" />
      </FormField>

      <div className="space-y-1.5">
        <Label>Notify channels</Label>
        <MultiSelect
          items={channelItems}
          selected={selectedChannelIds}
          onAdd={(id) => setValue("channelIds", [...selectedChannelIds, id])}
          onRemove={(id) => setValue("channelIds", selectedChannelIds.filter((c) => c !== id))}
          placeholder="Search channels…"
        />
        {errors.channelIds && <p className="text-xs text-destructive">{errors.channelIds.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Watch resources</Label>
        <MultiSelect
          items={resourceItems}
          selected={selectedResourceIds}
          onAdd={(id) => setValue("resources", [...selectedResourceIds, id])}
          onRemove={(id) => setValue("resources", selectedResourceIds.filter((r) => r !== id))}
          placeholder="Search monitors or heartbeats…"
        />
        {errors.resources && <p className="text-xs text-destructive">{errors.resources.message}</p>}
      </div>

      <FormField label={<>Latency threshold (ms) <span className="text-muted-foreground">— optional</span></>}>
        <Input {...register("latencyMs")} type="number" placeholder="e.g. 2000" />
      </FormField>
    </FormDialog>
  )
}
