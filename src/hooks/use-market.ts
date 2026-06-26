"use client";

import { useQuery } from "@tanstack/react-query";

import { cacheMs } from "@/lib/cache-config";

export type MarketItem = {
  symbol: string;
  ticker: string;
  label: string;
  type: "stock" | "crypto" | "macro";
  gfUrl?: string;
  hideCurrencySymbol?: boolean;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  currency: string;
};

export type MarketData = {
  fetchedAt: string;
  items: MarketItem[];
};

export function useMarket() {
  return useQuery<MarketData>({
    queryKey: ["market"],
    queryFn: async () => {
      const res = await fetch("/api/market");
      if (!res.ok) throw new Error("Failed to fetch market data");
      return res.json();
    },
    staleTime: cacheMs("market"),
    refetchInterval: cacheMs("market"),
  });
}
