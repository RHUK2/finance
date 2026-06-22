import { HydrationBoundary } from "@tanstack/react-query";

import { prefetchEndpoints } from "@/lib/prefetch";

import { EconomyView } from "./economy-view";

export default async function EconomyPage() {
  const state = await prefetchEndpoints(["economy", "fred"]);

  return (
    <HydrationBoundary state={state}>
      <EconomyView />
    </HydrationBoundary>
  );
}
