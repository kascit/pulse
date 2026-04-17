import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQuery } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MultiSelect } from "@/components/forms/MultiSelect"
import { statusPagesAPI, monitorsAPI, heartbeatsAPI } from "@/lib/api"
import { useResourceMutation } from "@/hooks/useResourceMutation"
import type { StatusPage, Monitor, Heartbeat } from "@/types"
import { toast } from "sonner"

const slugify = (str: string) =>
  str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").slice(0, 60)

const schema = z.object({
  name: z.string().min(1, "Name required"),
  slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
  description: z.string().optional(),
  resources: z.array(z.string()),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  item?: StatusPage | null
}

export function StatusPageForm({ open, onOpenChange, item }: Props) {
  const isEdit = !!item

  const { data: monitors = [] } = useQuery<Monitor[]>({
    queryKey: ["monitors"],
    queryFn: async () => (await monitorsAPI.list()).data,
  })
  const { data: heartbeats = [] } = useQuery<Heartbeat[]>({
    queryKey: ["heartbeats"],
    queryFn: async () => (await heartbeatsAPI.list()).data,
  })

  const resourceItems = [
    ...monitors.map((m) => ({ _id: m._id, name: m.name, subLabel: "Monitor" })),
    ...heartbeats.map((h) => ({ _id: h._id, name: h.name, subLabel: "Heartbeat" })),
  ]

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", slug: "", description: "", resources: [] },
  })

  const selectedResources = watch("resources")
  const nameValue = watch("name")

  useEffect(() => {
    if (!isEdit && nameValue) setValue("slug", slugify(nameValue))
  }, [nameValue, isEdit, setValue])

  useEffect(() => {
    if (item) {
      const res = item.resources.map((r) => typeof r === "object" ? (r as any)._id : r)
      reset({ name: item.name, slug: item.slug, description: item.description ?? "", resources: res })
    } else {
      reset({ name: "", slug: "", description: "", resources: [] })
    }
  }, [item, open, reset])

  const mutation = useResourceMutation({
    mutationFn: (data: FormData) =>
      isEdit ? statusPagesAPI.update(item._id, data) : statusPagesAPI.create(data),
    invalidateQueryKeys: [["status-pages"]],
    successText: isEdit ? "Status page updated" : "Status page created",
    close: () => onOpenChange(false),
    onError: (err: any) => {
      toast.error(err?.response?.data?.error ?? "Something went wrong")
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Status Page" : "Create Status Page"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="sp-name">Name</Label>
            <Input id="sp-name" {...register("name")} placeholder="API Status" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sp-slug">Slug</Label>
            <div className="flex items-center gap-1 rounded-md border bg-muted px-3 text-sm">
              <span className="text-muted-foreground">/status/</span>
              <input
                id="sp-slug"
                {...register("slug")}
                className="flex-1 bg-transparent py-2 outline-none"
                placeholder="my-api"
              />
            </div>
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sp-desc">Description <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea id="sp-desc" {...register("description")} placeholder="Current status of our services" rows={2} />
          </div>

          <div className="space-y-1.5">
            <Label>Resources to display</Label>
            {resourceItems.length === 0 ? (
              <p className="text-xs text-muted-foreground">No monitors or heartbeats yet. Create some first.</p>
            ) : (
              <MultiSelect
                items={resourceItems}
                selected={selectedResources}
                onAdd={(id) => setValue("resources", [...selectedResources, id])}
                onRemove={(id) => setValue("resources", selectedResources.filter((r) => r !== id))}
                placeholder="Search monitors or heartbeats…"
              />
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>{isEdit ? "Save changes" : "Create page"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
