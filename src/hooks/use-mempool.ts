'use client';

import { useEndpoint } from '@/hooks/use-endpoint';

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

export type MiningPoolsData = {
  fetchedAt: string;
  totalBlocks: number;
  pools: { name: string; slug: string; blockCount: number; sharePct: number }[];
};

export type RecentBlocksData = {
  fetchedAt: string;
  blocks: {
    height: number;
    timestamp: number;
    poolName: string;
    poolSlug: string;
    txCount: number;
    sizeMB: number;
    vMB: number; // weight ÷ 4 (블록 한도 1 MvB 대비 충전율 계산용)
    rewardBTC: number;
    medianFee: number;
  }[];
};

export type HashrateHistoryData = {
  fetchedAt: string;
  history: { time: string; value: number }[];
  currentHashrateEHs: number;
  currentDifficultyT: number;
};

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

export const useMempoolStats = () => useEndpoint<MempoolStatsData>('mempool-stats');
export const useMiningStats = () => useEndpoint<MiningStatsData>('mining-stats');
export const useMiningPools = () => useEndpoint<MiningPoolsData>('mining-pools');
export const useRecentBlocks = () => useEndpoint<RecentBlocksData>('recent-blocks');
export const useHashrateHistory = () => useEndpoint<HashrateHistoryData>('hashrate-history');
export const useMempoolBlocks = () => useEndpoint<MempoolBlocksData>('mempool-blocks');
