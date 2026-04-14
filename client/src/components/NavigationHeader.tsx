import { useRef, useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuthStore } from "@/store/auth"
import { toast } from "sonner"
import { LogOut, Sun, Moon, Activity, Menu, X, Settings } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const NAV = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Monitors", href: "/monitors" },
  { label: "Heartbeats", href: "/heartbeats" },
  { label: "Alerts", href: "/alerts" },
  { label: "Status Pages", href: "/status-pages" },
  { label: "Logs", href: "/logs" },
]

export function NavigationHeader() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user, clearAuth } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const avatarRef = useRef<HTMLDivElement>(null)

  const logout = () => { clearAuth(); toast.success("Logged out"); window.location.href = "/" }
  const isActive = (href: string) => href === "/dashboard" ? pathname === href : pathname.startsWith(href)
  const navTo = (href: string) => { navigate(href); setMobileOpen(false); setAvatarOpen(false) }

  // Close avatar dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">

        {/* Logo + desktop nav */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate(user ? "/dashboard" : "/")}
            className="flex cursor-pointer items-center gap-2"
          >
            <Activity className="h-5 w-5 text-primary" />
            <span className="font-bold tracking-tight">Pulse</span>
          </button>

          {user && (
            <nav className="hidden items-center gap-0.5 md:flex">
              {NAV.map((item) => (
                <button
                  key={item.href}
                  onClick={() => navTo(item.href)}
                  className={cn(
                    "cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="cursor-pointer rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {user ? (
            <>
              {/* Avatar with dropdown */}
              <div ref={avatarRef} className="relative">
                <button
                  onClick={() => setAvatarOpen((o) => !o)}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-muted"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    {user.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <span className="hidden max-w-[120px] truncate text-sm font-medium lg:inline">{user.name}</span>
                </button>

                {avatarOpen && (
                  <div className="absolute right-0 mt-1 w-52 overflow-hidden rounded-lg border bg-popover shadow-lg">
                    <div className="border-b px-3 py-2.5">
                      <p className="text-sm font-semibold">{user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => navTo("/settings")}
                        className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted"
                      >
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        Settings
                      </button>
                      <button
                        onClick={logout}
                        className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Hamburger — mobile only */}
              <button
                onClick={() => setMobileOpen((o) => !o)}
                className="cursor-pointer rounded-md p-2 text-muted-foreground hover:bg-muted md:hidden"
              >
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate("/auth?mode=login")}
                className="cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Sign in
              </button>
              <button
                onClick={() => navigate("/auth?mode=register")}
                className="cursor-pointer rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Get started
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile dropdown nav */}
      {user && mobileOpen && (
        <div className="border-t bg-background px-4 py-2 md:hidden">
          <nav className="flex flex-col gap-0.5">
            {NAV.map((item) => (
              <button
                key={item.href}
                onClick={() => navTo(item.href)}
                className={cn(
                  "w-full cursor-pointer rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => navTo("/settings")}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              <Settings className="h-4 w-4" /> Settings
            </button>
            <button
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </nav>
        </div>
      )}
    </header>
  )
}
