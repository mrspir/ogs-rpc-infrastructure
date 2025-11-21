import type { ApiRouteConfig, Handlers } from "motia";
import { z } from "zod";
import { executeQuery } from "../../src/services/clickhouse/client";

const responseSchema = z.object({
  ok: z.literal(true),
  latencyMs: z.number(),
  timestamp: z.string(),
});

export const config: ApiRouteConfig = {
  name: "ClickHouseHealthCheck",
  type: "api",
  method: "GET",
  path: "/health/clickhouse",
  description: "Verify ClickHouse connectivity and credentials",
  emits: [],
  flows: ["infra-health"],
  responseSchema: {
    200: responseSchema,
  },
};

export const handler: Handlers["ClickHouseHealthCheck"] = async (
  _,
  { logger }
) => {
  const startedAt = Date.now();
  logger.info("Running ClickHouse health check");

  await executeQuery<{ alive: number }>("SELECT 1 AS alive");

  const latencyMs = Date.now() - startedAt;

  return {
    status: 200,
    body: {
      ok: true,
      latencyMs,
      timestamp: new Date().toISOString(),
    },
  };
};
