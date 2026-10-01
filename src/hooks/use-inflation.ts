'use client';

import { useEndpoint } from '@/hooks/use-endpoint';
import type { InflationData } from '@/lib/loaders/inflation';

// 응답 타입은 로더(src/lib/loaders/)가 정본이다. 미국·한국 두 키가 같은 모양을 준다.
export type { InflationData };

export const useInflationData = () => useEndpoint<InflationData>('inflation-data');
export const useInflationDataKr = () => useEndpoint<InflationData>('inflation-data-kr');
