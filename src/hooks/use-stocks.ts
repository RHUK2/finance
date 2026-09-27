'use client';

import { useEndpoint } from '@/hooks/use-endpoint';
import type { MacroSeries } from '@/lib/series';

/** 키는 `src/app/api/stocks/route.ts`의 `SYMBOLS`와 1:1이다. */
export type StocksData = {
  fetchedAt: string;
  tsla: MacroSeries;
  nvda: MacroSeries;
  tsm: MacroSeries;
  samsung: MacroSeries;
  hynix: MacroSeries;
  googl: MacroSeries;
  msft: MacroSeries;
  aapl: MacroSeries;
  meta: MacroSeries;
  amzn: MacroSeries;
  nke: MacroSeries;
  spcx: MacroSeries;
};

export type StockKey = Exclude<keyof StocksData, 'fetchedAt'>;

export type StrategyData = {
  fetchedAt: string;
  mstr: MacroSeries;
  strc: MacroSeries;
};

export const useStocks = () => useEndpoint<StocksData>('stocks');
export const useStrategy = () => useEndpoint<StrategyData>('strategy');
