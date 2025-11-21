"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NetworkRow } from "@/components/network-row";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Mock data for networks
const networks = [
  {
    id: "story",
    name: "Story",
    symbol: "IP",
    type: "Mainnet",
    ecosystem: "EVM",
    status: "operational",
    latency: 26,
    blockHeight: 19873456,
    requests: 1_250_000,
    logo: "/images/chains-logo/story.webp",
    endpoints: [
      {
        id: "evm",
        label: "EVM",
        slug: "evm",
        transports: ["rpc", "wss", "rest"],
      },
      {
        id: "consensus",
        label: "Consensus",
        slug: "consensus",
        transports: ["rpc"],
      },
    ],
  },
  {
    id: "monad",
    name: "Monad",
    symbol: "MON",
    type: "Mainnet",
    ecosystem: "EVM",
    status: "operational",
    latency: 33,
    blockHeight: 8456721,
    requests: 820_000,
    logo: "/images/chains-logo/monad.webp",
    endpoints: [
      {
        id: "evm",
        label: "EVM",
        slug: "evm",
        transports: ["rpc", "wss", "rest"],
      },
      {
        id: "consensus",
        label: "Consensus",
        slug: "consensus",
        transports: ["rpc"],
      },
    ],
  },
  {
    id: "0g",
    name: "0g",
    symbol: "0G",
    type: "Mainnet",
    ecosystem: "Cosmos",
    status: "degraded",
    latency: 72,
    blockHeight: 5678901,
    requests: 540_000,
    logo: "/images/chains-logo/0g.webp",
    endpoints: [
      { id: "evm", label: "EVM", slug: "evm", transports: ["rpc", "wss"] },
      {
        id: "consensus",
        label: "Tendermint",
        slug: "tendermint",
        transports: ["rpc"],
      },
    ],
  },
  {
    id: "ethereum",
    name: "Ethereum",
    symbol: "ETH",
    type: "Mainnet",
    ecosystem: "EVM",
    status: "operational",
    latency: 24,
    blockHeight: 19823456,
    requests: 2_450_000,
    logo: "/images/chains-logo/ethereum.webp",
    endpoints: [
      {
        id: "evm",
        label: "EVM",
        slug: "evm",
        transports: ["rpc", "wss", "rest"],
      },
      {
        id: "consensus",
        label: "Consensus",
        slug: "consensus",
        transports: ["rpc"],
      },
    ],
  },
];

export function NetworkExplorer() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredNetworks = networks.filter((network) => {
    const matchesSearch =
      network.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      network.symbol.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "mainnet")
      return matchesSearch && network.type === "Mainnet";
    if (activeTab === "testnet")
      return matchesSearch && network.type === "Testnet";

    return matchesSearch;
  });

  return (
    <section className="py-20 container mx-auto px-4" id="networks">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">
            Public RPC Endpoints
          </h2>
          <p className="text-muted-foreground">
            Direct access to high-performance nodes. No sign-up required for
            public tier.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search networks..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full sm:w-auto"
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="mainnet">Mainnet</TabsTrigger>
              <TabsTrigger value="testnet">Testnet</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[250px]">Network</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">
                Requests (24h)
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                Performance
              </TableHead>
              <TableHead className="text-right">Public Endpoint</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredNetworks.map((network) => (
              <NetworkRow key={network.id} network={network} />
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredNetworks.length === 0 && (
        <div className="text-center py-20 border rounded-lg border-dashed mt-4">
          <p className="text-muted-foreground">
            No networks found matching your criteria.
          </p>
          <Button
            variant="link"
            onClick={() => {
              setSearchQuery("");
              setActiveTab("all");
            }}
          >
            Clear filters
          </Button>
        </div>
      )}
    </section>
  );
}
