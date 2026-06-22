import { HydrationBoundary } from "@tanstack/react-query";

import { prefetchEndpoints } from "@/lib/prefetch";

import { AssetsView } from "./assets-view";

export default async function AssetsPage() {
  const state = await prefetchEndpoints(["market"]);

  return (
    <HydrationBoundary state={state}>
      <AssetsView />
    </HydrationBoundary>
  );
}
