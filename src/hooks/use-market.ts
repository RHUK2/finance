"use client";

import { useEndpoint } from "@/hooks/use-endpoint";

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

export const useMarket = () => useEndpoint<MarketData>("market");
