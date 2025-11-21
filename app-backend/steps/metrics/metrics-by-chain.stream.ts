import { StreamConfig } from "motia";
import { z } from "zod";

const metricsByChainSchema = z.object({
  chain: z.string(),
  env: z.string(),
  region: z.string(),
  requests24h: z.number(),
  currentRps: z.number(),
  errorRate: z.number(),
  latencyP50: z.number(),
  latencyP95: z.number(),
  updatedAt: z.string(),
});

export const config: StreamConfig = {
  name: "metricsByChain",
  schema: metricsByChainSchema,
  baseConfig: {
    storageType: "default",
  },
};

export type MetricsByChain = z.infer<typeof metricsByChainSchema>;

