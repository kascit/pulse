import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Eye, EyeOff, CheckCircle, XCircle, ArrowLeft } from "lucide-react"
import { authAPI } from "@/lib/api"
import { useAuthStore } from "@/store/auth"
import { toast } from "sonner"
import { Layout } from "@/components/Layout"
import { FormField } from "@/components/forms/FormField"
import { cn } from "@/lib/utils"

const simplePassword = z.string().min(6, "At least 6 characters")

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
})

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50).regex(/^[\w\s'-]+$/, "Letters, numbers, spaces, hyphens only"),
  email: z.string().email("Please enter a valid email"),
  password: simplePassword,
})

// ── Main AuthPage ─────────────────────────────────────────────────────────────

export default function AuthPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const isRegister = searchParams.get("mode") === "register"
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(isRegister ? registerSchema : loginSchema),
  })
  const password = watch("password") ?? ""

  // Step 1: send OTP (register) or log in directly
  const authMutation = useMutation({
    mutationFn: (data: any) =>
      isRegister ? authAPI.register(data) : authAPI.login(data),
    onSuccess: (r) => {
      console.log("Auth success:", r)
      useAuthStore.getState().setAuth(r.data.token, r.data.user)
      navigate("/dashboard")
      toast.success(isRegister ? "Account created!" : "Welcome back!")
    },
    onError: (e: any) => {
      console.error("Auth error:", e)
      toast.error(
        e.response?.data?.error ?? e.response?.data?.message ?? "Failed"
      )
    },
  })

  const toggleMode = () => {
    reset()
    setSearchParams({ mode: isRegister ? "login" : "register" })
  }

  return (
    <Layout>
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Card className="w-full max-w-sm shadow-lg">
          <CardHeader className="pb-4 text-center">
            <CardTitle className="text-2xl font-bold">
              {isRegister ? "Create your account" : "Welcome back"}
            </CardTitle>
            <CardDescription>
              {isRegister
                ? "Start monitoring for free — no credit card required."
                : "Sign in to your Pulse dashboard."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit((d) => authMutation.mutate(d))}
              className="space-y-4"
            >
              {isRegister && (
                <FormField label="Name" error={errors.name?.message as string}>
                  <Input
                    id="name"
                    placeholder="Your name"
                    autoComplete="name"
                    {...register("name")}
                  />
                </FormField>
              )}
              <FormField label="Email" error={errors.email?.message as string}>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...register("email")}
                />
              </FormField>
              <FormField
                label="Password"
                error={errors.password?.message as string}
              >
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="pr-10"
                    placeholder={
                      isRegister ? "Strong password" : "Your password"
                    }
                    autoComplete={
                      isRegister ? "new-password" : "current-password"
                    }
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormField>
              <Button
                type="submit"
                className="w-full"
                disabled={authMutation.isPending}
              >
                {authMutation.isPending
                  ? isRegister
                    ? "Sending code…"
                    : "Signing in…"
                  : isRegister
                    ? "Create account"
                    : "Sign in"}
              </Button>
            </form>



            <p className="mt-4 text-center text-sm text-muted-foreground">
              {isRegister
                ? "Already have an account? "
                : "Don't have an account? "}
              <button
                onClick={toggleMode}
                className="cursor-pointer font-medium text-primary hover:underline"
              >
                {isRegister ? "Sign in" : "Sign up free"}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
