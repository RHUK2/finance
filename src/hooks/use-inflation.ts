'use client';

import { useEndpoint } from '@/hooks/use-endpoint';
import type { MacroSeries } from '@/lib/series';

export type InflationData = {
  fetchedAt: string;
  available: boolean;
  cpi?: MacroSeries;
  m2?: MacroSeries;
  deposit?: MacroSeries;
  stock?: MacroSeries;
  house?: MacroSeries;
  fx?: MacroSeries; // 원/달러 환율(월별). USD 자산을 원화로 환산할 때 사용(한국만 제공)
};

export const useInflationData = () => useEndpoint<InflationData>('inflation-data');
export const useInflationDataKr = () => useEndpoint<InflationData>('inflation-data-kr');
