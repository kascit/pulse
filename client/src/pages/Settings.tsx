import { useState } from "react"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Layout } from "@/components/Layout"
import { FormField } from "@/components/forms/FormField"
import { authAPI } from "@/lib/api"
import { useAuthStore } from "@/store/auth"
import { toast } from "sonner"
import { Eye, EyeOff, Trash2 } from "lucide-react"

const simplePassword = z.string().min(6, "At least 6 characters")

const profileSchema = z.object({
  name: z.string().min(2, "At least 2 characters").max(50).regex(/^[\w\s'-]+$/, "Letters, numbers, spaces, hyphens only"),
  email: z.string().email("Enter a valid email"),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password required"),
  newPassword: simplePassword,
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type PasswordFields = { currentPassword: string; newPassword: string; confirmPassword: string }

export default function Settings() {
  const { user, updateUser, clearAuth } = useAuthStore()
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState("")

  // ── Profile form ─────────────────────────────────────────────────────────
  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? "", email: user?.email ?? "" },
  })

  const profileMutation = useMutation({
    mutationFn: (data: { name: string; email: string }) => authAPI.updateMe(data),
    onSuccess: (r) => {
      updateUser(r.data)
      toast.success("Profile updated")
    },
    onError: (e: any) => toast.error(e.response?.data?.error ?? e.response?.data?.message ?? "Update failed"),
  })

  // ── Password form ─────────────────────────────────────────────────────────
  const passForm = useForm<PasswordFields>({ resolver: zodResolver(passwordSchema) })

  const passMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => authAPI.updateMe(data),
    onSuccess: () => { toast.success("Password updated"); passForm.reset() },
    onError: (e: any) => toast.error(e.response?.data?.error ?? e.response?.data?.message ?? "Password change failed"),
  })

  // ── Delete account ────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: () => authAPI.deleteMe(deletePassword),
    onSuccess: () => { clearAuth(); toast.success("Account deleted"); window.location.href = "/" },
    onError: (e: any) => toast.error(e.response?.data?.error ?? e.response?.data?.message ?? "Deletion failed"),
  })

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your account preferences</p>
      </div>

      <div className="mx-auto max-w-xl space-y-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your display name and email address</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit((d) => profileMutation.mutate(d))} className="space-y-4">
              <FormField label="Name" error={profileForm.formState.errors.name?.message}>
                <Input id="settings-name" autoComplete="name" {...profileForm.register("name")} />
              </FormField>
              <FormField label="Email" error={profileForm.formState.errors.email?.message}>
                <Input id="settings-email" type="email" autoComplete="email" {...profileForm.register("email")} />
              </FormField>
              <Button type="submit" disabled={profileMutation.isPending}>
                {profileMutation.isPending ? "Saving…" : "Save changes"}
              </Button>
            </form>


          </CardContent>
        </Card>

        {/* Password */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Choose a new password with at least 6 characters</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passForm.handleSubmit((d) => passMutation.mutate(d as PasswordFields))} className="space-y-4">
              <FormField label="Current password" error={passForm.formState.errors.currentPassword?.message as string | undefined}>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrent ? "text" : "password"}
                    autoComplete="current-password"
                    className="pr-10"
                    {...passForm.register("currentPassword")}
                  />
                  <button type="button" onClick={() => setShowCurrent(v => !v)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormField>

              <FormField label="New password" error={passForm.formState.errors.newPassword?.message as string | undefined}>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNew ? "text" : "password"}
                    autoComplete="new-password"
                    className="pr-10"
                    {...passForm.register("newPassword")}
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormField>

              <FormField label="Confirm new password" error={passForm.formState.errors.confirmPassword?.message as string | undefined}>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  {...passForm.register("confirmPassword")}
                />
              </FormField>

              <Button type="submit" disabled={passMutation.isPending}>
                {passMutation.isPending ? "Updating…" : "Update password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Danger zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Permanently delete your account and all data. This cannot be undone.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormField label="Type your password to confirm">
              <Input
                id="delete-password"
                name="delete-password"
                type="password"
                placeholder="Your current password"
                autoComplete="current-password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
            </FormField>
            <FormField label={`Type "delete my account" to confirm`}>
              <Input
                id="delete-confirm"
                name="delete-confirm"
                placeholder='delete my account'
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
              />
            </FormField>
            <Button
              variant="destructive"
              disabled={deleteConfirm !== "delete my account" || !deletePassword || deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleteMutation.isPending ? "Deleting…" : "Delete my account"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
