"use client";

import { useQuery } from "@tanstack/react-query";

import { cacheMs } from "@/lib/cache-config";

export type MacroSeries = {
  history: { time: string; value: number }[];
  current: number | null;
  changePercent: number | null;
};

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

export function useEconomy() {
  return useQuery<EconomyData>({
    queryKey: ["economy"],
    queryFn: async () => {
      const res = await fetch("/api/economy");
      if (!res.ok) throw new Error("Failed to fetch economy data");
      return res.json();
    },
    staleTime: cacheMs("economy"),
    refetchInterval: cacheMs("economy"),
  });
}

export type FredData = {
  fetchedAt: string;
  available: boolean;
  m2?: MacroSeries;
  fedFunds?: MacroSeries;
  us2y?: MacroSeries;
  cpi?: MacroSeries;
};

export function useFred() {
  return useQuery<FredData>({
    queryKey: ["fred"],
    queryFn: async () => {
      const res = await fetch("/api/fred");
      if (!res.ok) throw new Error("Failed to fetch FRED data");
      return res.json();
    },
    staleTime: cacheMs("fred"),
    refetchInterval: cacheMs("fred"),
  });
}
