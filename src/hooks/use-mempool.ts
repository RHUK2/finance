"use client";

import { useQuery } from "@tanstack/react-query";

export type MempoolStatsData = {
  pendingTxCount: number;
  mempoolSizeMB: number;
  fastFee: number;
  halfHourFee: number;
  hourFee: number;
};

export type MiningStatsData = {
  hashrateEHs: number;
  blockHeight: number;
  blockRewardBTC: number;
  difficultyChangePct: number;
  previousDifficultyChangePct: number;
  remainingBlocks: number;
  estimatedRetargetDate: string;
  nextHalvingBlock: number;
  remainingHalvingBlocks: number;
  estimatedHalvingDate: string;
  nextRewardBTC: number;
};

export type LightningStatsData = {
  nodeCount: number;
  channelCount: number;
  totalCapacityBTC: number;
};

export type NodesStatsData = {
  fullNodeCount: number | null;
};

export function useMempoolStats() {
  return useQuery<MempoolStatsData>({
    queryKey: ["mempool-stats"],
    queryFn: async () => {
      const res = await fetch("/api/mempool-stats");
      if (!res.ok) throw new Error("Failed to fetch mempool stats");
      return res.json();
    },
  });
}

export function useMiningStats() {
  return useQuery<MiningStatsData>({
    queryKey: ["mining-stats"],
    queryFn: async () => {
      const res = await fetch("/api/mining-stats");
      if (!res.ok) throw new Error("Failed to fetch mining stats");
      return res.json();
    },
  });
}

export function useLightningStats() {
  return useQuery<LightningStatsData>({
    queryKey: ["lightning-stats"],
    queryFn: async () => {
      const res = await fetch("/api/lightning-stats");
      if (!res.ok) throw new Error("Failed to fetch lightning stats");
      return res.json();
    },
  });
}

export function useNodesStats() {
  return useQuery<NodesStatsData>({
    queryKey: ["nodes-stats"],
    queryFn: async () => {
      const res = await fetch("/api/nodes-stats");
      if (!res.ok) throw new Error("Failed to fetch nodes stats");
      return res.json();
    },
  });
}
