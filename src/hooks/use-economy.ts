"use client";

import { useQuery } from "@tanstack/react-query";

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
};

export function useEconomy() {
  return useQuery<EconomyData>({
    queryKey: ["economy"],
    queryFn: async () => {
      const res = await fetch("/api/economy");
      if (!res.ok) throw new Error("Failed to fetch economy data");
      return res.json();
    },
    staleTime: 3_600_000,
  });
}

export type FredData = {
  fetchedAt: string;
  available: boolean;
  m2?: MacroSeries;
  fedFunds?: MacroSeries;
};

export function useFred() {
  return useQuery<FredData>({
    queryKey: ["fred"],
    queryFn: async () => {
      const res = await fetch("/api/fred");
      if (!res.ok) throw new Error("Failed to fetch FRED data");
      return res.json();
    },
    staleTime: 86_400_000,
  });
}
