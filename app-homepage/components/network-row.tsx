"use client";

import Image from "next/image";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Activity,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NetworkProps {
  network: {
    id: string;
    name: string;
    symbol: string;
    type: string;
    ecosystem: string;
    status: string;
    latency: number;
    blockHeight: number;
    requests: number;
    logo: string;
  };
}

export function NetworkRow({ network }: NetworkProps) {
  const [copied, setCopied] = useState(false);
  const [endpointType, setEndpointType] = useState("rpc");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "text-green-500";
      case "degraded":
        return "text-yellow-500";
      case "maintenance":
        return "text-red-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return (
          <div className="relative flex h-3 w-3 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </div>
        );
      case "degraded":
        return <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />;
      case "maintenance":
        return <XCircle className="h-4 w-4 mr-2 text-red-500" />;
      default:
        return <CheckCircle2 className="h-4 w-4 mr-2" />;
    }
  };

  const getLatencyColor = (ms: number) => {
    if (ms < 100) return "text-green-500";
    if (ms < 300) return "text-yellow-500";
    return "text-red-500";
  };

  const getEndpoint = () => {
    const baseUrl = "https://infra.originstake.com/v1";
    const chain = network.id;
    const net = network.type.toLowerCase();

    switch (endpointType) {
      case "rpc":
        return `${baseUrl}/${chain}/${net}/rpc`;
      case "wss":
        return `wss://infra.originstake.com/v1/${chain}/${net}/ws`;
      case "rest":
        return `${baseUrl}/${chain}/${net}/rest`;
      default:
        return `${baseUrl}/${chain}/${net}/rpc`;
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getEndpoint());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TableRow className="group hover:bg-muted/50 transition-colors border-b border-border/50">
      <TableCell className="font-medium">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-muted border border-border/40 flex items-center justify-center shrink-0 shadow-[0_10px_25px_-15px_rgba(0,0,0,0.9)]">
            <Image
              src={network.logo}
              alt={`${network.name} logo`}
              width={24}
              height={24}
              className="h-8 w-8 object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">
              {network.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {network.ecosystem}
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant={network.type === "Mainnet" ? "default" : "secondary"}
          className="text-[10px] px-2 py-0.5 h-5 font-mono tracking-wider"
        >
          {network.type.toUpperCase()}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center">
          {getStatusIcon(network.status)}
          <span
            className={`capitalize text-sm font-medium ${getStatusColor(
              network.status
            )}`}
          >
            {network.status}
          </span>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
            <Activity className="h-3 w-3" />
            {network.requests.toLocaleString()}
          </div>
          <div className="h-1 w-24 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary/50 rounded-full"
              style={{
                width: `${Math.min((network.requests / 1000000) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <div className="flex flex-col gap-0.5">
          <span
            className={`font-mono text-sm font-medium ${getLatencyColor(
              network.latency
            )}`}
          >
            {network.latency > 0 ? `${network.latency}ms` : "-"}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            #{network.blockHeight.toLocaleString()}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Select value={endpointType} onValueChange={setEndpointType}>
            <SelectTrigger className="h-9 w-[85px] text-xs font-medium bg-background border-input/50 hover:bg-accent hover:text-accent-foreground transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rpc">RPC</SelectItem>
              <SelectItem value="wss">WSS</SelectItem>
              <SelectItem value="rest">REST</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative group/code flex items-center max-w-[200px] sm:max-w-[300px] lg:max-w-[400px] shadow-sm">
            <div className="h-9 bg-zinc-950 rounded-l-md border border-r-0 border-input/50 flex items-center px-3 w-full overflow-hidden transition-colors group-hover/code:border-primary/30">
              <code className="text-xs font-mono text-zinc-400 truncate select-all">
                {getEndpoint()}
              </code>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-l-none border-l-0 shrink-0 bg-background hover:bg-primary hover:text-primary-foreground transition-all active:scale-95"
              onClick={copyToClipboard}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}
