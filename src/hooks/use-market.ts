'use client';

import { useEndpoint } from '@/hooks/use-endpoint';
import type { MarketData } from '@/lib/loaders/market';

// 응답 타입은 로더(src/lib/loaders/)가 정본이다. `import type`이라 서버 코드는 따라오지 않는다.
export type { MarketData };

/** 실시간 시세(300초). 시계열이 필요하면 `use-stocks`나 `use-crypto`를 쓴다. */
export const useMarket = () => useEndpoint<MarketData>('market');
