"use client";

import { useQuery } from "@tanstack/react-query";

import { type MacroSeries } from "@/hooks/use-economy";
import { cacheMs } from "@/lib/cache-config";

export type CommoditiesData = {
  fetchedAt: string;
  gold: MacroSeries;
  wti: MacroSeries;
  brent: MacroSeries;
  corn: MacroSeries;
};

export function useCommodities() {
  return useQuery<CommoditiesData>({
    queryKey: ["commodities"],
    queryFn: async () => {
      const res = await fetch("/api/commodities");
      if (!res.ok) throw new Error("Failed to fetch commodities data");
      return res.json();
    },
    staleTime: cacheMs("commodities"),
    refetchInterval: cacheMs("commodities"),
  });
}
