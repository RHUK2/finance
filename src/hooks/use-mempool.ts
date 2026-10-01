'use client';

import { useEndpoint } from '@/hooks/use-endpoint';
import type { HashrateHistoryData } from '@/lib/loaders/hashrate-history';
import type { MempoolBlocksData } from '@/lib/loaders/mempool-blocks';
import type { MempoolStatsData } from '@/lib/loaders/mempool-stats';
import type { MiningPoolsData } from '@/lib/loaders/mining-pools';
import type { MiningStatsData } from '@/lib/loaders/mining-stats';
import type { RecentBlocksData } from '@/lib/loaders/recent-blocks';

// 응답 타입은 로더(src/lib/loaders/)가 정본이다. `import type`이라 서버 코드는 따라오지 않는다.
export type {
  HashrateHistoryData,
  MempoolBlocksData,
  MempoolStatsData,
  MiningPoolsData,
  MiningStatsData,
  RecentBlocksData,
};

export const useMempoolStats = () => useEndpoint<MempoolStatsData>('mempool-stats');
export const useMiningStats = () => useEndpoint<MiningStatsData>('mining-stats');
export const useMiningPools = () => useEndpoint<MiningPoolsData>('mining-pools');
export const useRecentBlocks = () => useEndpoint<RecentBlocksData>('recent-blocks');
export const useHashrateHistory = () => useEndpoint<HashrateHistoryData>('hashrate-history');
export const useMempoolBlocks = () => useEndpoint<MempoolBlocksData>('mempool-blocks');
