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
import { useStream } from "@motiadev/stream-client-react";

type GlobalMetricsStreamProps = {
  wsUrl: string; // WebSocket URL, e.g., "ws://localhost:3001"
  initialData: MetricsOverview | null; // SSR data
};

/**
 * Component using Motia Streams for real-time metrics updates
 * 
 * How it works:
 * 1. Connects to WebSocket at wsUrl (e.g., "ws://localhost:3001")
 * 2. Subscribes to "metricsOverview" stream, groupId="global", id="global"
 * 3. Automatically receives updates every 5s when Cron Step pushes new data
 * 4. No polling needed - WebSocket handles everything
 */
export function GlobalMetricsStream({
  wsUrl,
  initialData,
}: GlobalMetricsStreamProps) {
  // Subscribe to real-time stream
  const { data: streamData, error: streamError } = useStream<MetricsOverview>({
    groupId: "global",
    id: "global",
    streamName: "metricsOverview",
  });

  // Use stream data if available, otherwise fallback to initial SSR data
  const overview = streamData ?? initialData;
  const [isConnected, setIsConnected] = useState(!!streamData);

  useEffect(() => {
    setIsConnected(!!streamData);
  }, [streamData]);

  // Animation values (same as original component)
  const totalRequests = useMotionValue(initialData?.totalRequests24h ?? 0);
  const currentRps = useMotionValue(initialData?.currentRps ?? 0);
  const errorRate = useMotionValue(initialData?.errorRate ?? 0);
  const uptime = useMotionValue(initialData?.uptime30d ?? 1);

  const totalRequestsSpring = useSpring(totalRequests, {
    stiffness: 50,
    damping: 30,
  });
  const currentRpsSpring = useSpring(currentRps, {
    stiffness: 100,
    damping: 40,
  });
  const errorRateSpring = useSpring(errorRate, {
    stiffness: 80,
    damping: 35,
  });
  const uptimeSpring = useSpring(uptime, {
    stiffness: 60,
    damping: 30,
  });

  // Update animation values when stream data changes
  useEffect(() => {
    if (overview) {
      totalRequests.set(overview.totalRequests24h);
      currentRps.set(overview.currentRps);
      errorRate.set(overview.errorRate);
      uptime.set(overview.uptime30d);
    }
  }, [overview, totalRequests, currentRps, errorRate, uptime]);

  const [displayTotalRequests, setDisplayTotalRequests] = useState(0);
  const [displayRps, setDisplayRps] = useState(0);
  const [displayErrorRate, setDisplayErrorRate] = useState(0);
  const [displayUptime, setDisplayUptime] = useState(1);

  useMotionValueEvent(totalRequestsSpring, "change", (latest) => {
    setDisplayTotalRequests(latest);
  });
  useMotionValueEvent(currentRpsSpring, "change", (latest) => {
    setDisplayRps(latest);
  });
  useMotionValueEvent(errorRateSpring, "change", (latest) => {
    setDisplayErrorRate(latest);
  });
  useMotionValueEvent(uptimeSpring, "change", (latest) => {
    setDisplayUptime(latest);
  });

  const metrics = useMemo(
    () => [
      {
        label: "Total Requests (24h)",
        value: displayTotalRequests,
        icon: Globe,
        format: (v: number) => formatMetricNumber(v),
      },
      {
        label: "Current RPS",
        value: displayRps,
        icon: Zap,
        format: (v: number) => v.toFixed(1),
      },
      {
        label: "Error Rate",
        value: displayErrorRate * 100,
        icon: Activity,
        format: (v: number) => `${v.toFixed(2)}%`,
      },
      {
        label: "Uptime (30d)",
        value: displayUptime * 100,
        icon: Server,
        format: (v: number) => `${v.toFixed(2)}%`,
      },
    ],
    [displayTotalRequests, displayRps, displayErrorRate, displayUptime]
  );

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="relative overflow-hidden rounded-lg border bg-card p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {metric.label}
              </p>
              <motion.p className="text-2xl font-bold">
                {metric.format(metric.value)}
              </motion.p>
            </div>
            <metric.icon className="h-8 w-8 text-muted-foreground" />
          </div>
          
          {/* Connection status indicator */}
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <div
              className={`h-2 w-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-yellow-500"
              }`}
            />
            <span>
              {isConnected ? "Live" : streamError ? "Error" : "Connecting..."}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

