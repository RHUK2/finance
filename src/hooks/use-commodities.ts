'use client';

import { useEndpoint } from '@/hooks/use-endpoint';
import type { CommoditiesData } from '@/lib/loaders/commodities';

// 응답 타입은 로더(src/lib/loaders/)가 `SYMBOLS`에서 만든다. `import type`이라 서버 코드는 따라오지 않는다.
export type { CommoditiesData };

export const useCommodities = () => useEndpoint<CommoditiesData>('commodities');
