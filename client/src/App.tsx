import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "@/lib/queryClient"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useAuthStore } from "@/store/auth"
import Landing from "@/pages/Landing"
import AuthPage from "@/pages/AuthPage"
import Dashboard from "@/pages/Dashboard"
import Monitors from "@/pages/Monitors"
import Heartbeats from "@/pages/Heartbeats"
import Alerts from "@/pages/Alerts"
import StatusPages from "@/pages/StatusPages"
import Logs from "@/pages/Logs"
import MonitorDetail from "@/pages/MonitorDetail"
import HeartbeatDetail from "@/pages/HeartbeatDetail"
import AlertChannelDetail from "@/pages/AlertChannelDetail"
import AlertRuleDetail from "@/pages/AlertRuleDetail"
import StatusPageDetail from "@/pages/StatusPageDetail"
import PublicStatus from "@/pages/PublicStatus"
import LogDetail from "@/pages/LogDetail"
import Settings from "@/pages/Settings"

const PROTECTED = [
  ["/dashboard", <Dashboard />],
  ["/monitors", <Monitors />],
  ["/monitors/:id", <MonitorDetail />],
  ["/heartbeats", <Heartbeats />],
  ["/heartbeats/:id", <HeartbeatDetail />],
  ["/alerts", <Alerts />],
  ["/alerts/channels/:id", <AlertChannelDetail />],
  ["/alerts/rules/:id", <AlertRuleDetail />],
  ["/status-pages", <StatusPages />],
  ["/status-pages/:id", <StatusPageDetail />],
  ["/logs", <Logs />],
  ["/logs/:id", <LogDetail />],
  ["/settings", <Settings />],
] as const

function AppRoutes() {
  const { token } = useAuthStore()
  const isAuth = !!token

  return (
    <Routes>
      <Route path="/" element={isAuth ? <Navigate to="/dashboard" replace /> : <Landing />} />
      <Route path="/auth" element={isAuth ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
      <Route path="/login" element={<Navigate to="/auth?mode=login" replace />} />
      <Route path="/register" element={<Navigate to="/auth?mode=register" replace />} />
      <Route path="/status/:slug" element={<PublicStatus />} />

      {PROTECTED.map(([path, element]) => (
        <Route
          key={path}
          path={path}
          element={<ProtectedRoute>{element as React.ReactElement}</ProtectedRoute>}
        />
      ))}

      <Route path="*" element={<Navigate to={isAuth ? "/dashboard" : "/"} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AppRoutes />
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
