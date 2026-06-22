"use client";

import { useQuery } from "@tanstack/react-query";

import { cacheMs } from "@/lib/cache-config";

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

export function useFearGreed() {
  return useQuery<FearGreedData>({
    queryKey: ["fear-greed"],
    queryFn: async () => {
      const res = await fetch("/api/fear-greed");
      if (!res.ok) throw new Error("Failed to fetch fear & greed data");
      return res.json();
    },
    staleTime: cacheMs("fear-greed"),
    refetchInterval: cacheMs("fear-greed"),
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
    staleTime: cacheMs("mvrv"),
    refetchInterval: cacheMs("mvrv"),
  });
}

export type BitcoinHistoricalData = {
  fetchedAt: string;
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
    staleTime: cacheMs("bitcoin-historical"),
    refetchInterval: cacheMs("bitcoin-historical"),
  });
}
