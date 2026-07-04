"use client";

import { useEndpoint } from "@/hooks/use-endpoint";
import type { MacroSeries } from "@/lib/series";

export type CommoditiesData = {
  fetchedAt: string;
  gold: MacroSeries;
  wti: MacroSeries;
  brent: MacroSeries;
  corn: MacroSeries;
};

export const useCommodities = () => useEndpoint<CommoditiesData>("commodities");
