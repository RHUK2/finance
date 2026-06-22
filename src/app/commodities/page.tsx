import { HydrationBoundary } from "@tanstack/react-query";

import { prefetchEndpoints } from "@/lib/prefetch";

import { CommoditiesView } from "./commodities-view";

export default async function CommoditiesPage() {
  const state = await prefetchEndpoints(["commodities"]);

  return (
    <HydrationBoundary state={state}>
      <CommoditiesView />
    </HydrationBoundary>
  );
}
