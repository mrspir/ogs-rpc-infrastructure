import type { CronConfig, Handlers } from "motia";
import { metricsService } from "../../src/services/metrics";
import type { MetricsOverview } from "./metrics-overview.stream";
import type { MetricsByChain } from "./metrics-by-chain.stream";

export const config: CronConfig = {
  name: "RefreshRpcMetrics",
  type: "cron",
  cron: "*/1 * * * *", // Every minute (5-field format: minute hour day month weekday)
  description:
    "Refresh RPC metrics from ClickHouse and push to streams every minute (background refresh)",
  emits: [],
  flows: ["metrics-dashboard"],
};

export const handler: Handlers["RefreshRpcMetrics"] = async ({
  logger,
  streams,
}) => {
  try {
    logger.info("Refreshing RPC metrics from ClickHouse");

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

    // Push to stream with key "global"
    await streams.metricsOverview.set("global", "global", overviewData);
    logger.info("Updated metricsOverview stream", {
      totalRequests24h: overviewData.totalRequests24h,
      currentRps: overviewData.currentRps,
    });

    // 2. Fetch metrics by chain
    const chainsData = await metricsService.getMetricsByChain({});

    // Push each chain to stream with key "<chain>-<env>"
    for (const chainData of chainsData) {
      const chainKey = `${chainData.chain}-${chainData.env}`;
      const chainStreamData: MetricsByChain = {
        chain: chainData.chain,
        env: chainData.env,
        region: chainData.region,
        requests24h: chainData.requests24h,
        currentRps: chainData.currentRps,
        errorRate: chainData.errorRate,
        latencyP50: chainData.latencyP50,
        latencyP95: chainData.latencyP95,
        updatedAt: chainData.updatedAt,
      };

      await streams.metricsByChain.set("chains", chainKey, chainStreamData);
    }

    logger.info("Updated metricsByChain stream", {
      chainCount: chainsData.length,
    });
  } catch (error: any) {
    logger.error("Failed to refresh RPC metrics", {
      error: error.message,
      stack: error.stack,
    });
    // Don't throw - let cron continue running
  }
};
