'use client';

import { useEndpoint } from '@/hooks/use-endpoint';

export type MarketItem = {
  symbol: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  currency: string;
};

export type MarketData = {
  fetchedAt: string;
  items: MarketItem[];
};

/** 실시간 시세(300초). 시계열이 필요하면 `use-stocks`나 `use-crypto`를 쓴다. */
export const useMarket = () => useEndpoint<MarketData>('market');
