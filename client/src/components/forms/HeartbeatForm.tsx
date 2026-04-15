import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useResourceMutation } from "@/hooks/useResourceMutation"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { FormDialog } from "./FormDialog"
import { FormField } from "./FormField"
import { heartbeatsAPI } from "@/lib/api"
import type { Heartbeat } from "@/types"
import { parseTagList } from "@/lib/utils"

const schema = z.object({
  name: z.string().min(1, "Name required"),
  graceMinutes: z.number().int().min(1).max(1440),
  tags: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props { open: boolean; onOpenChange: (o: boolean) => void; item?: Heartbeat | null }

export function HeartbeatForm({ open, onOpenChange, item }: Props) {
  const isEdit = !!item

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", graceMinutes: 5, tags: "" },
  })

  useEffect(() => {
    reset(item
      ? { name: item.name, graceMinutes: item.graceMinutes, tags: item.tags?.join(", ") ?? "" }
      : { name: "", graceMinutes: 5, tags: "" }
    )
  }, [item, open, reset])

  const mutation = useResourceMutation({
    mutationFn: (data: FormData) => {
      const payload = { ...data, tags: parseTagList(data.tags) }
      return isEdit ? heartbeatsAPI.update(item._id, payload) : heartbeatsAPI.create(payload)
    },
    invalidateQueryKeys: [["heartbeats"]],
    successText: isEdit ? "Heartbeat updated" : "Heartbeat created",
    close: () => onOpenChange(false),
  })

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit Heartbeat" : "Create Heartbeat"}
      description="Passive monitor — your service pings Pulse to prove it's alive."
      onSubmit={handleSubmit((d) => mutation.mutate(d))}
      isPending={mutation.isPending}
      submitLabel={isEdit ? "Save changes" : "Create heartbeat"}
    >
      <FormField label="Name" error={errors.name?.message}>
        <Input {...register("name")} placeholder="Daily backup job" autoComplete="off" />
      </FormField>

      <div className="space-y-2">
        <Label>Grace period: {watch("graceMinutes")} minute{watch("graceMinutes") !== 1 ? "s" : ""}</Label>
        <Slider
          value={[watch("graceMinutes")]}
          onValueChange={(v) => setValue("graceMinutes", v[0])}
          min={1} max={60} step={1}
        />
        <p className="text-xs text-muted-foreground">If no ping arrives within this window, the heartbeat goes down.</p>
      </div>

      <FormField label={<>Tags <span className="text-muted-foreground">(comma separated)</span></>}>
        <Input {...register("tags")} placeholder="cron, backup" />
      </FormField>

      {!isEdit && (
        <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          After creating, you'll get a unique ping URL to call from your cron job or script.
        </p>
      )}
    </FormDialog>
  )
}
