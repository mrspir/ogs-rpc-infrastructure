import type { ApiRouteConfig, Handlers } from "motia";
import { z } from "zod";
import { metricsService } from "../../src/services/metrics";
import type { MetricsOverview } from "../metrics/metrics-overview.stream";
import type { MetricsByChain } from "../metrics/metrics-by-chain.stream";

export const config: ApiRouteConfig = {
  name: "RefreshMetricsNow",
  type: "api",
  method: "POST",
  path: "/metrics/refresh",
  description:
    "Trigger immediate metrics refresh and push to stream (for real-time updates)",
  emits: [],
  flows: ["metrics-dashboard"],
  responseSchema: {
    200: z.object({
      success: z.boolean(),
      message: z.string(),
      overview: z.any().optional(),
    }),
  },
};

export const handler: Handlers["RefreshMetricsNow"] = async (
  _,
  { logger, streams }
) => {
  try {
    logger.info("Triggering immediate metrics refresh");

    // 1. Fetch overview metrics
    const overview = await metricsService.getOverview();
    const overviewData: MetricsOverview = {
      totalRequests24h: overview.totalRequests24h,
      totalRequests30d: overview.totalRequests30d,
      totalRequests90d: overview.totalRequests90d,
      totalRequestsAllTime: overview.totalRequestsAllTime,
      currentRps: overview.currentRps,
      errorRate: overview.errorRate,
      uptime30d: overview.uptime30d,
      updatedAt: overview.updatedAt,
    };

    // Push to stream
    const streamResult = await streams.metricsOverview.set(
      "global",
      "global",
      overviewData
    );

    logger.info("Stream updated successfully", {
      totalRequests24h: overviewData.totalRequests24h,
      currentRps: overviewData.currentRps,
    });

    return {
      status: 200,
      body: {
        success: true,
        message: "Metrics refreshed and pushed to stream successfully.",
        overview: streamResult,
      },
    };
  } catch (error: any) {
    logger.error("Failed to update stream", {
      error: error.message,
      stack: error.stack,
    });

    return {
      status: 200,
      body: {
        success: false,
        message: `Failed to update stream: ${error.message}`,
      },
    };
  }
};
