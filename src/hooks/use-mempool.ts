"use client";

import { useQuery } from "@tanstack/react-query";

export type MempoolStatsData = {
  fetchedAt: string;
  pendingTxCount: number;
  mempoolSizeMB: number;
  fastFee: number;
  halfHourFee: number;
  hourFee: number;
};

export type MiningStatsData = {
  fetchedAt: string;
  hashrateEHs: number;
  hashrateChangePct: number;
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
  fetchedAt: string;
  nodeCount: number;
  channelCount: number;
  totalCapacityBTC: number;
  nodeCountChangePct: number;
  channelCountChangePct: number;
  capacityChangePct: number;
};

export function useMempoolStats() {
  return useQuery<MempoolStatsData>({
    queryKey: ["mempool-stats"],
    queryFn: async () => {
      const res = await fetch("/api/mempool-stats");
      if (!res.ok) throw new Error("Failed to fetch mempool stats");
      return res.json();
    },
    staleTime: 60_000,
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
    staleTime: 600_000,
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
    staleTime: 3_600_000,
  });
}
