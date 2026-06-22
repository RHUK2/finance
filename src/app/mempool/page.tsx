import { HydrationBoundary } from "@tanstack/react-query";

import { prefetchEndpoints } from "@/lib/prefetch";

import { MempoolView } from "./mempool-view";

export default async function MempoolPage() {
  const state = await prefetchEndpoints([
    "mempool-stats",
    "mining-stats",
    "lightning-stats",
    "mempool-blocks",
    "recent-blocks",
    "hashrate-history",
    "mining-pools",
  ]);

  return (
    <HydrationBoundary state={state}>
      <MempoolView />
    </HydrationBoundary>
  );
}
