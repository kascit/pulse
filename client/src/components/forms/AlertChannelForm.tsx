import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useResourceMutation } from "@/hooks/useResourceMutation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormDialog } from "./FormDialog"
import { FormField } from "./FormField"
import { alertChannelsAPI } from "@/lib/api"
import type { AlertChannel } from "@/types"
import { toast } from "sonner"

const schema = z
  .object({
    name: z.string().min(1, "Name required"),
    type: z.enum(["webhook", "telegram"]),
    url: z.string().optional(),
    botToken: z.string().optional(),
    chatId: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.type === "webhook" && !val.url)
      ctx.addIssue({ code: "custom", path: ["url"], message: "Webhook URL required" })
    if (val.type === "telegram" && !val.botToken)
      ctx.addIssue({ code: "custom", path: ["botToken"], message: "Bot token required" })
    if (val.type === "telegram" && !val.chatId)
      ctx.addIssue({ code: "custom", path: ["chatId"], message: "Chat ID required" })
  })

type FormData = z.infer<typeof schema>

const DEFAULTS: FormData = { name: "", type: "webhook", url: "https://", botToken: "", chatId: "" }

interface Props { open: boolean; onOpenChange: (o: boolean) => void; item?: AlertChannel | null }

export function AlertChannelForm({ open, onOpenChange, item }: Props) {
  const isEdit = !!item

  const { register, handleSubmit, watch, control, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  })

  const type = watch("type")

  useEffect(() => {
    reset(item ? {
      name: item.name, type: item.type,
      url: item.config.url ?? "https://",
      botToken: item.config.botToken ?? "",
      chatId: item.config.chatId ?? "",
    } : DEFAULTS)
  }, [item, open, reset])

  const mutation = useResourceMutation({
    mutationFn: (data: FormData) => {
      const config =
        data.type === "webhook" ? { url: data.url } :
        { botToken: data.botToken, chatId: data.chatId }
      const payload = { name: data.name, type: data.type, config }
      return isEdit ? alertChannelsAPI.update(item._id, payload) : alertChannelsAPI.create(payload)
    },
    invalidateQueryKeys: [["alert-channels"]],
    successText: isEdit ? "Channel updated" : "Channel created",
    close: () => onOpenChange(false),
    onError: (e: any) => toast.error(e.response?.data?.error ?? "Something went wrong"),
  })

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit Channel" : "Add Alert Channel"}
      description="Receive notifications via webhook or Telegram."
      onSubmit={handleSubmit((d) => mutation.mutate(d))}
      isPending={mutation.isPending}
      submitLabel={isEdit ? "Save changes" : "Add channel"}
    >
      <FormField label="Name" error={errors.name?.message}>
        <Input {...register("name")} placeholder="Discord Alerts" autoComplete="off" />
      </FormField>

      <FormField label="Type">
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="webhook">Webhook</SelectItem>
                <SelectItem value="telegram">Telegram</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </FormField>

      {type === "webhook" && (
        <FormField label="Webhook URL" error={errors.url?.message}>
          <Input {...register("url")} placeholder="https://hooks.slack.com/..." autoComplete="url" />
        </FormField>
      )}
      {type === "telegram" && (
        <>
          <FormField label="Bot Token" error={errors.botToken?.message}>
            <Input {...register("botToken")} type="password" placeholder="123456:ABCdef..." />
          </FormField>
          <FormField label="Chat ID" error={errors.chatId?.message}>
            <Input {...register("chatId")} placeholder="-100123456789" />
          </FormField>
        </>
      )}

    </FormDialog>
  )
}
