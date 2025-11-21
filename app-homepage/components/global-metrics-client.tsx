"use client";

import { useEffect, useMemo, useState } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
} from "framer-motion";
import { Activity, Globe, Server, Zap } from "lucide-react";
import { formatMetricNumber, type MetricsOverview } from "../lib/metrics";

type GlobalMetricsClientProps = {
  baseUrl: string;
  initialData: MetricsOverview | null;
  pollIntervalMs?: number;
};

const DEFAULT_POLL_INTERVAL = 15_000;

export function GlobalMetricsClient({
  baseUrl,
  initialData,
  pollIntervalMs = DEFAULT_POLL_INTERVAL,
}: GlobalMetricsClientProps) {
  const [overview, setOverview] = useState<MetricsOverview | null>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [displayLatency, setDisplayLatency] = useState<number | null>(null);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let controller: AbortController | null = null;
    let mounted = true;

    const fetchOverview = async () => {
      controller?.abort();
      controller = new AbortController();
      setIsRefreshing(true);
      const startedAt = performance.now();

      try {
        const response = await fetch(`${baseUrl}/metrics/overview`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to refresh metrics (${response.status})`);
        }

        const payload = (await response.json()) as MetricsOverview;

        if (!mounted) {
          return;
        }

        setOverview(payload);
        setLatency(performance.now() - startedAt);
        setError(null);
      } catch (fetchError) {
        if ((fetchError as DOMException).name === "AbortError" || !mounted) {
          return;
        }

        console.error(fetchError);
        setError("Live metrics temporarily unavailable");
      } finally {
        if (!mounted) {
          controller?.abort();
          return;
        }

        setIsRefreshing(false);
        timeoutId = setTimeout(fetchOverview, pollIntervalMs);
      }
    };

    fetchOverview();

    return () => {
      mounted = false;
      controller?.abort();
      clearTimeout(timeoutId);
    };
  }, [baseUrl, pollIntervalMs]);

  useEffect(() => {
    if (typeof latency === "number" && Number.isFinite(latency)) {
      setDisplayLatency(latency);
    }
  }, [latency]);

  const metrics = useMemo(
    () => [
      {
        label: "Total Requests (All time)",
        value: overview?.totalRequestsAllTime ?? null,
        change: null,
        icon: Activity,
        color: "text-blue-500",
        accent: "from-blue-500/15 to-blue-500/0",
      },
      {
        label: "Global Uptime",
        value: "99.99%",
        change: "Last 30 days",
        icon: Zap,
        color: "text-yellow-500",
        accent: "from-yellow-500/15 to-yellow-500/0",
      },
      {
        label: "Active Networks",
        value: "42",
        change: "Across 3 ecosystems",
        icon: Globe,
        color: "text-green-500",
        accent: "from-green-500/15 to-green-500/0",
      },
      {
        label: "Avg Latency",
        value: "45ms",
        change: "Global average",
        icon: Server,
        color: "text-purple-500",
        accent: "from-purple-500/15 to-purple-500/0",
      },
    ],
    [overview?.totalRequestsAllTime]
  );

  const lastUpdatedLabel = useMemo(() => {
    if (!overview?.updatedAt) {
      return "Awaiting first sample";
    }

    const timestamp = overview.updatedAt.includes(" ")
      ? overview.updatedAt.replace(" ", "T")
      : overview.updatedAt;

    const parsedDate = new Date(timestamp);

    if (Number.isNaN(parsedDate.valueOf())) {
      return overview.updatedAt;
    }

    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(parsedDate);
  }, [overview?.updatedAt]);

  return (
    <section className="border-b bg-muted/20">
      <div className="container mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 border-x">
          {metrics.map((metric) => (
            <motion.div
              key={metric.label}
              className="relative overflow-hidden p-6 md:p-8 flex flex-col items-center text-center md:items-start md:text-left"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              whileHover={{
                scale: 1.01,
                translateY: -2,
              }}
            >
              <motion.div
                className={`absolute inset-0 bg-linear-to-br ${metric.accent}`}
                animate={{ backgroundPositionX: ["0%", "100%"] }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              <div className="relative z-10 flex flex-col gap-4 w-full">
                <div
                  className={`w-fit rounded-full bg-background p-3 shadow-sm ring-1 ring-border ${metric.color}`}
                >
                  <metric.icon className="h-5 w-5" />
                </div>
                {metric.label === "Total Requests (All time)" ? (
                  <AnimatedNumber
                    value={metric.value}
                    isRefreshing={isRefreshing}
                  />
                ) : (
                  <div className="text-3xl font-bold tracking-tight tabular-nums">
                    {metric.value}
                  </div>
                )}
                <div className="text-sm font-medium text-muted-foreground">
                  {metric.label}
                </div>
                <div className="text-xs text-muted-foreground/60">
                  {metric.label === "Total Requests (All time)" ? (
                    <LiveStatusBadge
                      error={error}
                      isRefreshing={isRefreshing}
                      displayLatency={displayLatency}
                    />
                  ) : (
                    metric.change
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-end px-6 py-4 text-xs text-muted-foreground">
          <div className="font-mono uppercase tracking-wide">
            Updated at {lastUpdatedLabel}
          </div>
        </div>
      </div>
    </section>
  );
}

type AnimatedNumberProps = {
  value: number | string | null;
  isRefreshing: boolean;
};

function AnimatedNumber({ value, isRefreshing }: AnimatedNumberProps) {
  const targetValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
      ? Number(value)
      : 0;
  const motionValue = useMotionValue(targetValue);
  const spring = useSpring(motionValue, {
    stiffness: 120,
    damping: 20,
    mass: 0.8,
  });
  const [displayValue, setDisplayValue] = useState(
    formatMetricNumber(targetValue)
  );

  useEffect(() => {
    motionValue.set(targetValue);
  }, [motionValue, targetValue]);

  useMotionValueEvent(spring, "change", (latest) => {
    setDisplayValue(formatMetricNumber(latest));
  });

  useEffect(() => {
    if (value === null) {
      setDisplayValue("—");
    }
  }, [value]);

  return (
    <motion.div
      className="text-3xl font-bold tracking-tight tabular-nums"
      animate={{
        opacity: isRefreshing ? 0.7 : 1,
        scale: isRefreshing ? 0.995 : 1,
      }}
      transition={{ duration: 0.3 }}
    >
      {displayValue}
    </motion.div>
  );
}

type LiveStatusBadgeProps = {
  error: string | null;
  isRefreshing: boolean;
  displayLatency: number | null;
};

function LiveStatusBadge({
  error,
  isRefreshing,
  displayLatency,
}: LiveStatusBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-2 w-2 rounded-full ${
          error
            ? "bg-destructive"
            : isRefreshing
            ? "bg-amber-400"
            : "bg-green-500"
        }`}
      />
      <span>{error ? "Reconnecting to metrics stream…" : "Live metrics"}</span>
      {displayLatency !== null && !error && (
        <motion.span
          className="font-medium text-foreground/70"
          key={Math.round(displayLatency)}
          initial={{ opacity: 0, y: -2 }}
          animate={{ opacity: isRefreshing ? 0.6 : 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {Math.max(0, Math.round(displayLatency))}ms
        </motion.span>
      )}
    </div>
  );
}
