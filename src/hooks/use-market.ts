'use client';

import { useEndpoint } from '@/hooks/use-endpoint';
import type { MarketData, QuoteKey } from '@/lib/loaders/market';

// 응답 타입은 로더(src/lib/loaders/)가 정본이다. `import type`이라 서버 코드는 따라오지 않는다.
export type { MarketData, QuoteKey };

/** 일봉 히스토리의 끝점을 바꿀 실시간 시세(300초). 시계열은 `use-stocks`·`use-crypto`에서 받고 이 값을 얹는다. */
export const useMarket = () => useEndpoint<MarketData>('market');
