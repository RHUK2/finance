'use client';

import { useEndpoint } from '@/hooks/use-endpoint';

export type FearGreedData = {
  fetchedAt: string;
  value: number;
  classification: string;
  timestamp: string;
  history: { time: string; value: number }[];
};

export type MvrvData = {
  fetchedAt: string;
  value: number;
  date: string;
  history: { time: string; value: number }[];
  zScore: { time: string; value: number }[];
};

export type BitcoinHistoricalData = {
  fetchedAt: string;
  history: { time: string; value: number }[];
};

export const useFearGreed = () => useEndpoint<FearGreedData>('fear-greed');
export const useMvrv = () => useEndpoint<MvrvData>('mvrv');
export const useBitcoinHistorical = () => useEndpoint<BitcoinHistoricalData>('bitcoin-historical');
