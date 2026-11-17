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

export const useMempoolStats = () => useEndpoint('mempool-stats');
export const useMiningStats = () => useEndpoint('mining-stats');
export const useMiningPools = () => useEndpoint('mining-pools');
export const useRecentBlocks = () => useEndpoint('recent-blocks');
export const useHashrateHistory = () => useEndpoint('hashrate-history');
export const useMempoolBlocks = () => useEndpoint('mempool-blocks');
