import { NavigationHeader } from "./NavigationHeader"

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen min-w-[320px] bg-background">
      <NavigationHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
