"use client";

import { useQuery } from "@tanstack/react-query";

import { cacheMs } from "@/lib/cache-config";
import type { MacroSeries } from "@/hooks/use-economy";

export type InflationData = {
  fetchedAt: string;
  available: boolean;
  cpi?: MacroSeries;
  m2?: MacroSeries;
  deposit?: MacroSeries;
  stock?: MacroSeries;
  house?: MacroSeries;
};

export function useInflationData() {
  return useQuery<InflationData>({
    queryKey: ["inflation-data"],
    queryFn: async () => {
      const res = await fetch("/api/inflation-data");
      if (!res.ok) throw new Error("Failed to fetch inflation data");
      return res.json();
    },
    staleTime: cacheMs("inflation-data"),
    refetchInterval: cacheMs("inflation-data"),
  });
}

export function useInflationDataKr() {
  return useQuery<InflationData>({
    queryKey: ["inflation-data-kr"],
    queryFn: async () => {
      const res = await fetch("/api/inflation-data-kr");
      if (!res.ok) throw new Error("Failed to fetch Korea inflation data");
      return res.json();
    },
    staleTime: cacheMs("inflation-data-kr"),
    refetchInterval: cacheMs("inflation-data-kr"),
  });
}
