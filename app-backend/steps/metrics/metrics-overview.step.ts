import type { ApiRouteConfig, Handlers } from "motia";
import { z } from "zod";
import { metricsService } from "../../src/services/metrics";

const overviewResponseSchema = z.object({
  totalRequests24h: z.number(),
  totalRequests30d: z.number(),
  totalRequests90d: z.number(),
  totalRequestsAllTime: z.number(),
  currentRps: z.number(),
  errorRate: z.number(),
  uptime30d: z.number(),
  updatedAt: z.string(),
  window: z.object({
    from: z.string(),
    to: z.string(),
  }),
});

export const config: ApiRouteConfig = {
  name: "GetMetricsOverview",
  type: "api",
  method: "GET",
  path: "/metrics/overview",
  description: "Fetch aggregated metrics overview for the dashboard",
  emits: [],
  flows: ["metrics-dashboard"],
  responseSchema: {
    200: overviewResponseSchema,
  },
};

export const handler: Handlers["GetMetricsOverview"] = async (
  _,
  { logger }
) => {
  logger.info("Fetching metrics overview from ClickHouse");

  // Always query ClickHouse directly - fast and reliable
  // Stream is only for WebSocket real-time updates, not for HTTP API
  const overview = await metricsService.getOverview();

  return {
    status: 200,
    body: overview,
  };
};
