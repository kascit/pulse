import axios from "axios"
import { useAuthStore } from "@/store/auth"

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

export const api = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
})

api.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const isAuthEndpoint = err.config?.url?.includes('/auth/login') || err.config?.url?.includes('/auth/register');
    
    if (err.response?.status === 401 && !isAuthEndpoint) {
      useAuthStore.getState().clearAuth()
      if (window.location.pathname !== "/") {
        window.location.href = "/"
      }
    }
    return Promise.reject(err)
  }
)

const crud = (path: string) => ({
  list: () => api.get(path),
  get: (id: string) => api.get(`${path}/${id}`),
  create: (data: unknown) => api.post(path, data),
  update: (id: string, data: unknown) => api.put(`${path}/${id}`, data),
  remove: (id: string) => api.delete(`${path}/${id}`),
})

export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
  updateMe: (data: {
    name?: string
    email?: string
    currentPassword?: string
    newPassword?: string
  }) => api.patch("/auth/me", data),
  deleteMe: (password: string) =>
    api.delete("/auth/me", { data: { password } }),
}

export const monitorsAPI = {
  ...crud("/monitors"),
  toggle: (id: string) => api.patch(`/monitors/${id}/toggle`),
}
export const heartbeatsAPI = {
  ...crud("/heartbeats"),
  pingUrl: (token: string) =>
    `${BASE.replace("/api", "")}/api/heartbeat/${token}`,
}
export const alertChannelsAPI = crud("/alerts/channels")
export const alertRulesAPI = crud("/alerts/rules")
export const statusPagesAPI = crud("/status-pages")
export const statsAPI = {
  get: (resourceId: string, hours?: number) =>
    api.get(`/stats/${resourceId}`, { params: { hours } }),
}
export const logsAPI = {
  list: (params?: {
    resourceId?: string
    event?: string
    limit?: number
    page?: number
  }) => api.get("/logs", { params }),
  get: (id: string) => api.get(`/logs/${id}`),
}
export const publicAPI = {
  getStatusPage: (slug: string) => api.get(`/public/${slug}`),
}
