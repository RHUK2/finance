import type { MacroSeries } from '@/lib/series';

// 미국(FRED)·한국(ECOS) 인플레이션 로더가 같은 모양을 준다. 한국만 `fx`를 싣는다.
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
