import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Layout } from "@/components/Layout"
import { Activity, Heart, Globe, Bell, Check, Zap, Shield, Clock } from "lucide-react"

const features = [
  { icon: Activity, title: "HTTP Monitoring", description: "Monitor websites and APIs with customizable intervals. GET, POST, PUT, DELETE checks." },
  { icon: Heart, title: "Heartbeat Tracking", description: "Receive pings from cron jobs, scripts, and background workers. Know when they fail." },
  { icon: Globe, title: "Public Status Pages", description: "Share real-time status with your customers. No authentication required." },
  { icon: Bell, title: "Multi-Channel Alerts", description: "Get notified via webhook, Telegram, or email when things go wrong." },
  { icon: Zap, title: "Fast Setup", description: "Add monitors in seconds. No complex configuration. Start monitoring immediately." },
  { icon: Shield, title: "SSL Monitoring", description: "Track certificate expiry dates. Get warned before certificates expire." },
]

const checks = [
  "Unlimited monitors", "1-minute check intervals", "Public status pages",
  "Webhook alerts", "Telegram notifications", "SSL expiry tracking",
  "Response time metrics", "Uptime percentage tracking",
]

export default function Landing() {
  return (
    <Layout>
      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center rounded-full border bg-muted px-3 py-1 text-sm">
            <span className="mr-2 flex h-2 w-2 rounded-full bg-green-500" />
            It's completely free!
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
            Monitor everything.<br />
            <span className="text-primary">Stay informed.</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            Pulse monitors your websites, APIs, and background jobs. Get instant alerts when things go down.
            Simple setup, powerful features, zero cost.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/auth?mode=register">
              <Button size="lg" className="gap-2">
                <Activity className="h-4 w-4" />
                Start Monitoring Free
              </Button>
            </Link>
            <Link to="/auth?mode=login">
              <Button variant="outline" size="lg">Sign In</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold">Everything you need</h2>
          <p className="text-muted-foreground">All features included. No hidden costs, no credit card required.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="border-none bg-muted/50">
              <CardContent className="p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Included */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl rounded-2xl bg-muted p-8 md:p-12">
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-3xl font-bold">What's Included</h2>
            <p className="text-muted-foreground">Everything is free. Seriously.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {checks.map((c) => (
              <div key={c} className="flex items-center gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <span className="text-sm">{c}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center">
        <h2 className="mb-4 text-3xl font-bold">Ready to start monitoring?</h2>
        <p className="mb-8 text-muted-foreground">Join developers who trust Pulse for their monitoring needs.</p>
        <Link to="/auth?mode=register">
          <Button size="lg" className="gap-2">
            <Zap className="h-4 w-4" />
            Get Started Free
          </Button>
        </Link>
        <p className="mt-4 text-sm text-muted-foreground">No credit card required. Set up in 30 seconds.</p>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Pulse — Free uptime monitoring</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/auth?mode=login" className="hover:text-foreground">Sign In</Link>
            <Link to="/auth?mode=register" className="hover:text-foreground">Get Started</Link>
          </div>
        </div>
      </footer>
    </Layout>
  )
}
