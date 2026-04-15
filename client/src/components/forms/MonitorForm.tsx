import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { FormDialog } from "./FormDialog"
import { FormField } from "./FormField"
import { monitorsAPI } from "@/lib/api"
import type { Monitor } from "@/types"
import { parseTagList, safeJSONParse } from "@/lib/utils"
import { useResourceMutation } from "@/hooks/useResourceMutation"

const INTERVAL_OPTIONS = [1, 5, 15, 30, 60] as const

const schema = z.object({
  name: z.string().min(1, "Name required"),
  url: z.string().url("Must be a valid URL"),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "HEAD"]),
  intervalMinutes: z
    .number()
    .int()
    .refine((v) => INTERVAL_OPTIONS.includes(v), {
      message: "Interval must be 1, 5, 15, 30, or 60",
    }),
  expectedKeyword: z.string().optional(),
  headers: z.string().optional(),
  body: z.string().optional(),
  tags: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const DEFAULTS: FormData = {
  name: "",
  url: "https://",
  method: "GET",
  intervalMinutes: 5,
  expectedKeyword: "",
  headers: "",
  body: "",
  tags: "",
}

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  item?: Monitor | null
}

export function MonitorForm({ open, onOpenChange, item }: Props) {
  const isEdit = !!item

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  })

  useEffect(() => {
    reset(
      item
        ? {
            name: item.name,
            url: item.url,
            method: item.method,
            intervalMinutes: item.intervalMinutes,
            expectedKeyword: item.expectedKeyword ?? "",
            headers: item.headers ? JSON.stringify(item.headers, null, 2) : "",
            body: item.body ?? "",
            tags: item.tags?.join(", ") ?? "",
          }
        : DEFAULTS
    )
  }, [item, open, reset])

  const mutation = useResourceMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        ...data,
        tags: parseTagList(data.tags),
        headers: data.headers ? safeJSONParse(data.headers) : null,
      }
      return isEdit
        ? monitorsAPI.update(item._id, payload)
        : monitorsAPI.create(payload)
    },
    invalidateQueryKeys: [["monitors"]],
    successText: isEdit ? "Monitor updated" : "Monitor created",
    close: () => onOpenChange(false),
  })

  const method = watch("method")

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit Monitor" : "Create Monitor"}
      description="Configure an HTTP/S endpoint to monitor at regular intervals."
      onSubmit={handleSubmit((d) => mutation.mutate(d))}
      isPending={mutation.isPending}
      submitLabel={isEdit ? "Save changes" : "Create monitor"}
      className="max-w-lg"
    >
      <FormField label="Name" error={errors.name?.message}>
        <Input {...register("name")} placeholder="My API" autoComplete="off" />
      </FormField>

      <FormField label="URL" error={errors.url?.message}>
        <Input
          {...register("url")}
          placeholder="https://api.example.com/health"
          autoComplete="url"
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Method">
          <Select
            value={watch("method")}
            onValueChange={(v) => setValue("method", v as FormData["method"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["GET", "POST", "PUT", "DELETE", "HEAD"].map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label={`Interval: ${watch("intervalMinutes")}m`}>
          <Select
            value={String(watch("intervalMinutes"))}
            onValueChange={(v) => setValue("intervalMinutes", Number(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INTERVAL_OPTIONS.map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {m} min
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <FormField
        label={
          <>
            Expected keyword{" "}
            <span className="text-muted-foreground">(optional)</span>
          </>
        }
      >
        <Input
          {...register("expectedKeyword")}
          placeholder="ok, healthy, success"
        />
      </FormField>

      {(method === "POST" || method === "PUT") && (
        <>
          <FormField label="Headers (JSON)">
            <Textarea
              {...register("headers")}
              placeholder='{"Authorization": "Bearer token"}'
              className="font-mono text-xs"
              rows={3}
            />
          </FormField>
          <FormField label="Body">
            <Textarea
              {...register("body")}
              placeholder='{"key": "value"}'
              className="font-mono text-xs"
              rows={3}
            />
          </FormField>
        </>
      )}

      <FormField
        label={
          <>
            Tags{" "}
            <span className="text-muted-foreground">(comma separated)</span>
          </>
        }
      >
        <Input {...register("tags")} placeholder="production, api" />
      </FormField>
    </FormDialog>
  )
}
