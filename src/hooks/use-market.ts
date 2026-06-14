"use client";

import { useQuery } from "@tanstack/react-query";

export type MarketItem = {
  symbol: string;
  ticker: string;
  label: string;
  type: "stock" | "index" | "commodity" | "forex" | "crypto";
  gfUrl?: string;
  price: number | null;
  priceKrw?: number | null;
  change: number | null;
  changePercent: number | null;
  currency: string;
};

export function useMarket() {
  return useQuery<MarketItem[]>({
    queryKey: ["market"],
    queryFn: async () => {
      const res = await fetch("/api/market");
      if (!res.ok) throw new Error("Failed to fetch market data");
      return res.json();
    },
  });
}
