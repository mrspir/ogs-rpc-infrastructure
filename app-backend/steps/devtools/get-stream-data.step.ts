import type { ApiRouteConfig, Handlers } from "motia";
import { z } from "zod";

export const config: ApiRouteConfig = {
  name: "GetStreamData",
  type: "api",
  method: "GET",
  path: "/devtools/stream-data",
  description: "Get current stream data for testing",
  emits: [],
  flows: ["devtools"],
  responseSchema: {
    200: z.object({
      metricsOverview: z.any().nullable(),
      metricsByChain: z.any().nullable(),
    }),
  },
};

export const handler: Handlers["GetStreamData"] = async (
  _,
  { logger, streams }
) => {
  try {
    logger.info("Fetching current stream data");

    // Get overview stream data
    const overview = await streams.metricsOverview.get("global", "global");

    // Get all chains stream data
    const chains = await streams.metricsByChain.getGroup("chains");

    return {
      status: 200,
      body: {
        metricsOverview: overview,
        metricsByChain: chains,
      },
    };
  } catch (error: any) {
    logger.error("Failed to get stream data", {
      error: error.message,
      stack: error.stack,
    });

    return {
      status: 200,
      body: {
        metricsOverview: null,
        metricsByChain: null,
        error: error.message,
      },
    };
  }
};

