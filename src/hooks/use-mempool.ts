"use client";

import { useQuery } from "@tanstack/react-query";

import { cacheMs } from "@/lib/cache-config";

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
    staleTime: cacheMs("mempool-stats"),
    refetchInterval: cacheMs("mempool-stats"),
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
    staleTime: cacheMs("mining-stats"),
    refetchInterval: cacheMs("mining-stats"),
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
    staleTime: cacheMs("lightning-stats"),
    refetchInterval: cacheMs("lightning-stats"),
  });
}

export type MiningPoolsData = {
  fetchedAt: string;
  totalBlocks: number;
  pools: { name: string; slug: string; blockCount: number; sharePct: number }[];
};

export function useMiningPools() {
  return useQuery<MiningPoolsData>({
    queryKey: ["mining-pools"],
    queryFn: async () => {
      const res = await fetch("/api/mining-pools");
      if (!res.ok) throw new Error("Failed to fetch mining pools");
      return res.json();
    },
    staleTime: cacheMs("mining-pools"),
    refetchInterval: cacheMs("mining-pools"),
  });
}

export type RecentBlocksData = {
  fetchedAt: string;
  blocks: {
    height: number;
    timestamp: number;
    poolName: string;
    poolSlug: string;
    txCount: number;
    sizeMB: number;
    rewardBTC: number;
    medianFee: number;
  }[];
};

export function useRecentBlocks() {
  return useQuery<RecentBlocksData>({
    queryKey: ["recent-blocks"],
    queryFn: async () => {
      const res = await fetch("/api/recent-blocks");
      if (!res.ok) throw new Error("Failed to fetch recent blocks");
      return res.json();
    },
    staleTime: cacheMs("recent-blocks"),
    refetchInterval: cacheMs("recent-blocks"),
  });
}

export type HashrateHistoryData = {
  fetchedAt: string;
  history: { time: string; value: number }[];
  currentHashrateEHs: number;
  currentDifficultyT: number;
};

export function useHashrateHistory() {
  return useQuery<HashrateHistoryData>({
    queryKey: ["hashrate-history"],
    queryFn: async () => {
      const res = await fetch("/api/hashrate-history");
      if (!res.ok) throw new Error("Failed to fetch hashrate history");
      return res.json();
    },
    staleTime: cacheMs("hashrate-history"),
    refetchInterval: cacheMs("hashrate-history"),
  });
}

export type MempoolBlocksData = {
  fetchedAt: string;
  blocks: {
    medianFee: number;
    feeMin: number;
    feeMax: number;
    nTx: number;
    vMB: number;
  }[];
};

export function useMempoolBlocks() {
  return useQuery<MempoolBlocksData>({
    queryKey: ["mempool-blocks"],
    queryFn: async () => {
      const res = await fetch("/api/mempool-blocks");
      if (!res.ok) throw new Error("Failed to fetch mempool blocks");
      return res.json();
    },
    staleTime: cacheMs("mempool-blocks"),
    refetchInterval: cacheMs("mempool-blocks"),
  });
}
