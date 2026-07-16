'use client';

import { useEndpoint } from '@/hooks/use-endpoint';
import type { MacroSeries } from '@/lib/series';

export type { MacroSeries };

export type EconomyData = {
  fetchedAt: string;
  dxy: MacroSeries;
  us10y: MacroSeries;
  us30y: MacroSeries;
  vix: MacroSeries;
  nasdaq: MacroSeries;
  kospi: MacroSeries;
  usdkrw: MacroSeries;
};

export type FredData = {
  fetchedAt: string;
  available: boolean;
  fedFunds?: MacroSeries;
  us2y?: MacroSeries;
};

export const useEconomy = () => useEndpoint<EconomyData>('economy');
export const useFred = () => useEndpoint<FredData>('fred');
