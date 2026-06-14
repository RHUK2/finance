"use client";

import { useQuery } from "@tanstack/react-query";

export type FearGreedData = {
  value: number;
  classification: string;
  timestamp: string;
  history: { time: string; value: number }[];
};

export type MvrvData = {
  value: number;
  date: string;
  history: { time: string; value: number }[];
};

export function useFearGreed() {
  return useQuery<FearGreedData>({
    queryKey: ["fear-greed"],
    queryFn: async () => {
      const res = await fetch("/api/fear-greed");
      if (!res.ok) throw new Error("Failed to fetch fear & greed data");
      return res.json();
    },
  });
}

export function useMvrv() {
  return useQuery<MvrvData>({
    queryKey: ["mvrv"],
    queryFn: async () => {
      const res = await fetch("/api/mvrv");
      if (!res.ok) throw new Error("Failed to fetch MVRV data");
      return res.json();
    },
  });
}

export type BitcoinHistoricalData = {
  history: { time: string; value: number }[];
};

export function useBitcoinHistorical() {
  return useQuery<BitcoinHistoricalData>({
    queryKey: ["bitcoin-historical"],
    queryFn: async () => {
      const res = await fetch("/api/bitcoin-historical");
      if (!res.ok) throw new Error("Failed to fetch bitcoin historical data");
      return res.json();
    },
    staleTime: 1000 * 60 * 60,
  });
}
