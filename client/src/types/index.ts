export type ResourceType = "Monitor" | "Heartbeat" | "AlertChannel" | "AlertRule" | "StatusPage"

export interface ResourceBase {
  _id: string
  name: string
  resourceType: ResourceType
  isActive?: boolean
  isPaused?: boolean
  lastStatus?: "up" | "down" | "degraded" | "unknown" | "pending"
  lastCheckedAt?: string | null
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface Monitor extends ResourceBase {
  resourceType: "Monitor"
  url: string
  method: "GET" | "POST" | "PUT" | "DELETE" | "HEAD"
  intervalMinutes: number
  expectedKeyword?: string | null
  headers?: Record<string, string> | null
  body?: string | null
  sslExpiryDate?: string | null
}

export interface Heartbeat extends ResourceBase {
  resourceType: "Heartbeat"
  heartbeatToken: string
  graceMinutes: number
  lastPingedAt?: string | null
}

export interface AlertChannel extends ResourceBase {
  resourceType: "AlertChannel"
  type: "webhook" | "telegram"
  config: Record<string, string>
  enabled: boolean
}

export interface AlertRule extends ResourceBase {
  resourceType: "AlertRule"
  channelIds: string[] | AlertChannel[]
  resources: string[] | ResourceBase[]
  triggers: {
    latencyMs: number | null
  }
  enabled: boolean
}

export interface StatusPage extends ResourceBase {
  resourceType: "StatusPage"
  slug: string
  description: string
  resources: string[] | ResourceBase[]
}

export interface Check {
  _id: string
  resourceId: string
  timestamp: string
  isUp: boolean
  latencyMs: number
  statusCode: number
  error?: string | null
}

export interface Log {
  _id: string
  resourceId: string
  resourceName: string
  resourceType: string
  event:
    | "resource.created"
    | "resource.deleted"
    | "resource.up"
    | "resource.down"
    | "resource.degraded"
    | "alert.fired"
    | "check.failed"
  message: string
  metadata?: Record<string, unknown> | null
  timestamp: string
}

export interface ResourceStats {
  uptime: number
  avgLatency: number
  totalChecks: number
  upChecks: number
  downChecks: number
  reliability: {
    mtbf: number | null
    mttr: number | null
    incidents: number
    availability: number
  }
  hourlyBuckets: Array<{
    hour: string
    checks: number
    upChecks: number
    uptime: number
    avgLatency: number
  }>
  recentChecks: Check[]
}
