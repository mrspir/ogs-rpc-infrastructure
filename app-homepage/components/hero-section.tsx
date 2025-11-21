"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Play, Check } from "lucide-react";
import { useState } from "react";

export function HeroSection() {
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [copied, setCopied] = useState(false);
  const [responseJson, setResponseJson] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [blockHeight, setBlockHeight] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleTest = async () => {
    setIsLoading(true);
    setShowResult(false);
    setErrorMessage(null);

    const requestBody = {
      jsonrpc: "2.0",
      method: "eth_blockNumber",
      params: [],
      id: 1,
    };

    const start = performance.now();
    try {
      const res = await fetch(
        "https://lightnode-json-rpc-mainnet-story.grandvalleys.com/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );
      const end = performance.now();

      setStatusCode(res.status);
      setLatencyMs(Math.round(end - start));

      const data = await res.json();
      setResponseJson(JSON.stringify(data, null, 2));

      if (data && typeof data.result === "string") {
        try {
          const height = parseInt(data.result, 16);
          if (!Number.isNaN(height)) {
            setBlockHeight(height.toLocaleString());
          } else {
            setBlockHeight(null);
          }
        } catch {
          setBlockHeight(null);
        }
      } else {
        setBlockHeight(null);
      }

      setShowResult(true);
    } catch (error: any) {
      setErrorMessage(error?.message || "Unexpected error");
      setResponseJson(null);
      setLatencyMs(null);
      setBlockHeight(null);
      setStatusCode(null);
      setShowResult(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `curl -X POST https://lightnode-json-rpc-mainnet-story.grandvalleys.com/ -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative border-b bg-background py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center rounded-full border bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground mb-4">
            <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 mr-2 animate-pulse"></span>
            All Systems Operational
          </div>

          <h1 className="text-4xl font-bold tracking-tight md:text-5xl mb-3">
            Multi-Chain RPC Infrastructure
          </h1>

          <p className="text-muted-foreground max-w-2xl mx-auto">
            Enterprise-grade endpoints for 40+ networks. Test instantly, deploy
            confidently.
          </p>
        </div>

        <div className="mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Request Panel */}
            <div className="rounded-lg border bg-zinc-950 shadow-lg overflow-hidden">
              <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                    <div className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                    <div className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                  </div>
                  <span className="text-xs text-zinc-500 font-mono ml-1">
                    Request
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs text-zinc-400 hover:text-zinc-100"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <div className="p-4 font-mono text-xs text-zinc-300 space-y-1">
                <div className="flex gap-2">
                  <span className="text-cyan-400">$</span>
                  <span>curl -X POST \</span>
                </div>
                <div className="pl-4 text-zinc-400">
                  https://lightnode-json-rpc-mainnet-story.grandvalleys.com/ \
                </div>
                <div className="pl-4 text-zinc-400">
                  -H "Content-Type: application/json" \
                </div>
                <div className="pl-4 text-zinc-400">
                  {`-d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'`}
                </div>
              </div>
              <div className="px-4 pb-4">
                <Button
                  onClick={handleTest}
                  disabled={isLoading}
                  className="w-full h-9 text-sm"
                  size="sm"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Testing...
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 mr-2" />
                      Test Endpoint
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Response Panel */}
            <div
              className={`rounded-lg border shadow-lg overflow-hidden transition-all ${
                showResult
                  ? "bg-zinc-950 border-green-500/30"
                  : "bg-zinc-950/50 border-zinc-800"
              }`}
            >
              <div
                className="flex items-center justify-between border-b px-4 py-2"
                style={{
                  borderColor: showResult
                    ? "rgb(34 197 94 / 0.3)"
                    : "rgb(39 39 42)",
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                    <div className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                    <div className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                  </div>
                  <span className="text-xs text-zinc-500 font-mono ml-1">
                    Response
                  </span>
                </div>
                {showResult && (
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      errorMessage
                        ? "border-red-500/30 text-red-500"
                        : "border-green-500/30 text-green-500"
                    }`}
                  >
                    {errorMessage ? "Error" : `${statusCode ?? 200} OK`}
                  </Badge>
                )}
              </div>

              {showResult ? (
                <>
                  <div className="p-4 font-mono text-xs text-green-400 space-y-0.5 whitespace-pre-wrap">
                    {errorMessage ? (
                      <span className="text-red-400">
                        Error: {errorMessage}
                      </span>
                    ) : responseJson ? (
                      <pre className="whitespace-pre-wrap text-xs leading-relaxed">
                        {responseJson}
                      </pre>
                    ) : (
                      <span className="text-zinc-400">No response data</span>
                    )}
                  </div>
                  <div className="border-t border-zinc-800 bg-zinc-900/30 px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Network</span>
                      <span className="text-zinc-300 font-medium">
                        Story Mainnet
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Latency</span>
                      <span className="text-green-400 font-mono">
                        {latencyMs !== null ? `${latencyMs}ms` : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Block Height</span>
                      <span className="text-zinc-300 font-mono">
                        {blockHeight ? `#${blockHeight}` : "N/A"}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-4 h-full flex items-center justify-center min-h-[200px]">
                  <p className="text-zinc-600 text-sm">
                    Click "Test Endpoint" to see response
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
