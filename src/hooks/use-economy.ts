'use client';

import { useEndpoint } from '@/hooks/use-endpoint';
import type { EconomyData } from '@/lib/loaders/economy';
import type { FredData } from '@/lib/loaders/fred';

// 응답 타입은 로더(src/lib/loaders/)가 정본이다. 야후 쪽은 `SYMBOLS`에서 만든다.
// `import type`이라 서버 코드는 따라오지 않는다.
export type { EconomyData, FredData };

export const useEconomy = () => useEndpoint<EconomyData>('economy');
export const useFred = () => useEndpoint<FredData>('fred');
