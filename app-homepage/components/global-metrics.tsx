import { GlobalMetricsClient } from "./global-metrics-client";
import type { MetricsOverview } from "../lib/metrics";

const DEFAULT_BASE_URL =
  process.env.CLICKHOUSE_URL_DEV ??
  process.env.CLICKHOUSE_URL ??
  "http://localhost:3001";

async function fetchMetricsOverview(
  baseUrl: string
): Promise<MetricsOverview | null> {
  try {
    const response = await fetch(`${baseUrl}/metrics/overview`, {
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch metrics overview: ${response.status}`);
    }

    return (await response.json()) as MetricsOverview;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function GlobalMetrics() {
  const baseUrl = DEFAULT_BASE_URL;
  const overview = await fetchMetricsOverview(baseUrl);

  return (
    <GlobalMetricsClient
      baseUrl={baseUrl}
      initialData={overview}
      pollIntervalMs={1_000}
    />
  );
}
