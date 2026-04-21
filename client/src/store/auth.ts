import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

interface User {
  _id: string
  name: string
  email: string
}

interface AuthStore {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  setAuth: (token: string, user: User) => void
  updateUser: (user: Partial<User>) => void
  clearAuth: () => void
}

if (typeof window !== "undefined") {
  const existing = localStorage.getItem("auth-storage")
  if (existing?.includes('"state":{}')) localStorage.removeItem("auth-storage")
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) =>
        set({
          token: String(token || ""),
          user,
          isAuthenticated: !!token && !!user,
        }),
      clearAuth: () => set({ token: null, user: null, isAuthenticated: false }),
      updateUser: (updates) =>
        set((s) => ({ user: s.user ? { ...s.user, ...updates } : s.user })),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
      version: 1,
    }
  )
)
