import type { ApiRouteConfig, Handlers } from "motia";
import { z } from "zod";
import { metricsService } from "../../src/services/metrics";
import { getQueryValue } from "../../src/utils/http";

const querySchema = z.object({
  chain: z.string().optional(),
  env: z.string().optional(),
});

const responseSchema = z.object({
  env: z.string(),
  generatedAt: z.string(),
  items: z
    .array(
      z.object({
        chain: z.string(),
        env: z.string(),
        region: z.string(),
        requests24h: z.number(),
        currentRps: z.number(),
        errorRate: z.number(),
        latencyP50: z.number(),
        latencyP95: z.number(),
        updatedAt: z.string(),
      })
    )
    .default([]),
});

export const config: ApiRouteConfig = {
  name: "GetMetricsByChain",
  type: "api",
  method: "GET",
  path: "/metrics/by-chain",
  description: "List aggregated metrics grouped by chain/env combination",
  emits: [],
  flows: ["metrics-dashboard"],
  responseSchema: {
    200: responseSchema,
  },
};

export const handler: Handlers["GetMetricsByChain"] = async (
  req,
  { logger }
) => {
  const rawQuery = {
    chain: getQueryValue(req.queryParams, "chain"),
    env: getQueryValue(req.queryParams, "env"),
  };

  const filters = querySchema.parse(rawQuery);

  logger.info("Fetching metrics grouped by chain", filters);

  const items = await metricsService.getMetricsByChain(filters);

  return {
    status: 200,
    body: {
      env: filters.env ?? "all",
      generatedAt: new Date().toISOString(),
      items,
    },
  };
};
