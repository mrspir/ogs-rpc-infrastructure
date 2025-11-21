import {
  ClickHouseError,
  executeQuery,
  toDateTimeParam,
} from "../clickhouse/client";

type OverviewRow = {
  totalRequests24h: number;
  totalRequests30d: number;
  totalRequests90d: number;
  totalRequestsAllTime: number;
  errorRequests24h: number;
  currentRps: number | null;
  uptimeRatio: number | null;
  updatedAt: string | null;
};

type MetricsByChainRow = {
  chain: string;
  env: string;
  requests24h: number;
  currentRps: number | null;
  errorRate: number | null;
  latencyP50: number | null;
  latencyP95: number | null;
  updatedAt: string | null;
};

type TimeseriesRow = {
  bucket: string;
  requests: number;
  errors: number;
  latencyP95: number | null;
};

type ProjectOverviewRow = {
  requests30d: number;
  requests24h: number;
  currentRps: number | null;
  updatedAt: string | null;
};

type ProjectTopChainRow = {
  chain: string;
  requests: number;
};

const LOGS_TABLE =
  process.env.CLICKHOUSE_LOGS_TABLE?.trim() || "originstake.rpc_logs";
const ENV_COLUMN = process.env.CLICKHOUSE_ENV_COLUMN?.trim() || "network";
const PROJECT_COLUMN =
  process.env.CLICKHOUSE_PROJECT_COLUMN?.trim() || "consumer_id";

const RESOLUTION_SECONDS: Record<"5s" | "1m" | "5m", number> = {
  "5s": 5,
  "1m": 60,
  "5m": 300,
};

const parseNumber = (value: number | null | undefined): number =>
  Number(value ?? 0);

export const metricsService = {
  async getOverview() {
    const rows = await executeQuery<OverviewRow>(
      `
      WITH
        now() AS toTs,
        toTs - INTERVAL 24 HOUR AS from24h,
        toTs - INTERVAL 30 DAY AS from30d,
        toTs - INTERVAL 90 DAY AS from90d
      SELECT
        countIf(ts >= from24h) AS totalRequests24h,
        countIf(ts >= from30d) AS totalRequests30d,
        countIf(ts >= from90d) AS totalRequests90d,
        count() AS totalRequestsAllTime,
        countIf((status >= 400 OR is_error = 1) AND ts >= from24h) AS errorRequests24h,
        countIf(ts >= toTs - INTERVAL 60 SECOND) / 60 AS currentRps,
        1 - (
          countIf((status >= 500 OR is_error = 1) AND ts >= from30d)
          / nullIf(countIf(ts >= from30d), 0)
        ) AS uptimeRatio,
        max(ts) AS updatedAt
      FROM ${LOGS_TABLE}
      `
    );

    const [row] = rows;

    return {
      totalRequests24h: parseNumber(row?.totalRequests24h),
      totalRequests30d: parseNumber(row?.totalRequests30d),
      totalRequests90d: parseNumber(row?.totalRequests90d),
      totalRequestsAllTime: parseNumber(row?.totalRequestsAllTime),
      currentRps: parseNumber(row?.currentRps),
      errorRate:
        row && row.totalRequests24h > 0
          ? parseNumber(row.errorRequests24h) / row.totalRequests24h
          : 0,
      uptime30d: Math.max(0, Math.min(1, row?.uptimeRatio ?? 1)),
      updatedAt: row?.updatedAt ?? new Date().toISOString(),
      window: {
        from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString(),
      },
    };
  },

  async getMetricsByChain(filters: { chain?: string; env?: string }) {
    const rows = await executeQuery<MetricsByChainRow>(
      `
      WITH
        now() AS toTs,
        toTs - INTERVAL 24 HOUR AS fromTs
      SELECT
        chain,
        ${ENV_COLUMN} AS env,
        count() AS requests24h,
        countIf(ts >= toTs - INTERVAL 60 SECOND) / 60 AS currentRps,
        countIf(status >= 400 OR is_error = 1) / nullIf(count(), 0) AS errorRate,
        quantile(0.50)(latency_ms) AS latencyP50,
        quantile(0.95)(latency_ms) AS latencyP95,
        max(ts) AS updatedAt
      FROM ${LOGS_TABLE}
      WHERE ts BETWEEN fromTs AND toTs
        ${filters.chain ? "AND chain = {chain:String}" : ""}
        ${filters.env ? `AND ${ENV_COLUMN} = {env:String}` : ""}
      GROUP BY chain, ${ENV_COLUMN}
      ORDER BY requests24h DESC
      LIMIT 50
      `,
      {
        chain: filters.chain ?? "",
        env: filters.env ?? "",
      }
    );

    return rows.map((row) => ({
      chain: row.chain,
      env: row.env,
      region: "global",
      requests24h: parseNumber(row.requests24h),
      currentRps: parseNumber(row.currentRps),
      errorRate: row.errorRate ?? 0,
      latencyP50: row.latencyP50 ?? 0,
      latencyP95: row.latencyP95 ?? 0,
      updatedAt: row.updatedAt ?? new Date().toISOString(),
    }));
  },

  async getTimeseries(input: {
    chain: string;
    env: string;
    from: Date;
    to: Date;
    resolution: "5s" | "1m" | "5m";
  }) {
    const intervalSeconds = RESOLUTION_SECONDS[input.resolution];

    if (!intervalSeconds) {
      throw new ClickHouseError(`Unsupported resolution "${input.resolution}"`);
    }

    const rows = await executeQuery<TimeseriesRow>(
      `
      SELECT
        toStartOfInterval(ts, INTERVAL {intervalSeconds:Int32} SECOND) AS bucket,
        count() AS requests,
        countIf(status >= 400 OR is_error = 1) AS errors,
        quantile(0.95)(latency_ms) AS latencyP95
      FROM ${LOGS_TABLE}
      WHERE ts BETWEEN parseDateTimeBestEffort({from:String}) AND parseDateTimeBestEffort({to:String})
        AND chain = {chain:String}
        AND ${ENV_COLUMN} = {env:String}
      GROUP BY bucket
      ORDER BY bucket ASC
      `,
      {
        intervalSeconds,
        from: toDateTimeParam(input.from),
        to: toDateTimeParam(input.to),
        chain: input.chain,
        env: input.env,
      }
    );

    return rows.map((row) => ({
      ts: row.bucket,
      requests: parseNumber(row.requests),
      errors: parseNumber(row.errors),
      latencyP95: row.latencyP95 ?? 0,
    }));
  },

  async getProjectOverview(projectId: string) {
    const [overview] = await executeQuery<ProjectOverviewRow>(
      `
      WITH
        now() AS nowTs
      SELECT
        countIf(ts >= nowTs - INTERVAL 30 DAY) AS requests30d,
        countIf(ts >= nowTs - INTERVAL 24 HOUR) AS requests24h,
        countIf(ts >= nowTs - INTERVAL 60 SECOND) / 60 AS currentRps,
        max(ts) AS updatedAt
      FROM ${LOGS_TABLE}
      WHERE ${PROJECT_COLUMN} = {projectId:String}
      `,
      { projectId }
    );

    const topChains = await executeQuery<ProjectTopChainRow>(
      `
      WITH
        now() AS nowTs
      SELECT
        chain,
        count() AS requests
      FROM ${LOGS_TABLE}
      WHERE ${PROJECT_COLUMN} = {projectId:String}
        AND ts >= nowTs - INTERVAL 30 DAY
      GROUP BY chain
      ORDER BY requests DESC
      LIMIT 5
      `,
      { projectId }
    );

    if (!overview) {
      return null;
    }

    return {
      projectId,
      requests30d: parseNumber(overview.requests30d),
      requests24h: parseNumber(overview.requests24h),
      currentRps: parseNumber(overview.currentRps),
      updatedAt: overview.updatedAt ?? new Date().toISOString(),
      topChains: topChains.map((chain) => ({
        chain: chain.chain,
        requests: parseNumber(chain.requests),
      })),
    };
  },
};
