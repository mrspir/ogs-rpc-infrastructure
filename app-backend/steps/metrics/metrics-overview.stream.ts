import { StreamConfig } from "motia";
import { z } from "zod";

const metricsOverviewSchema = z.object({
  totalRequests24h: z.number(),
  totalRequests30d: z.number(),
  totalRequests90d: z.number(),
  totalRequestsAllTime: z.number(),
  currentRps: z.number(),
  errorRate: z.number(),
  uptime30d: z.number(),
  updatedAt: z.string(),
});

export const config: StreamConfig = {
  name: "metricsOverview",
  schema: metricsOverviewSchema,
  baseConfig: {
    storageType: "default",
  },
};

export type MetricsOverview = z.infer<typeof metricsOverviewSchema>;

