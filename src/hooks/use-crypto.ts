'use client';

import { useEndpoint } from '@/hooks/use-endpoint';
import type { BitcoinHistoricalData } from '@/lib/loaders/bitcoin-historical';
import type { FearGreedData } from '@/lib/loaders/fear-greed';
import type { MvrvData } from '@/lib/loaders/mvrv';

// 응답 타입은 로더(src/lib/loaders/)가 정본이다. `import type`이라 서버 코드는 따라오지 않는다.
export type { BitcoinHistoricalData, FearGreedData, MvrvData };

export const useFearGreed = () => useEndpoint<FearGreedData>('fear-greed');
export const useMvrv = () => useEndpoint<MvrvData>('mvrv');
export const useBitcoinHistorical = () => useEndpoint<BitcoinHistoricalData>('bitcoin-historical');
