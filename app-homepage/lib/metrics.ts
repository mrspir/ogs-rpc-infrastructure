export type MetricsOverview = {
  totalRequests24h: number
  totalRequests30d: number
  totalRequests90d: number
  totalRequestsAllTime: number
  currentRps: number
  errorRate: number
  uptime30d: number
  updatedAt: string
  window: {
    from: string
    to: string
  }
}

export function formatMetricNumber(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—"
  }

  const normalized = Math.round(Math.max(0, value))
  return new Intl.NumberFormat("en-US").format(normalized)
}

