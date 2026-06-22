import { HydrationBoundary } from "@tanstack/react-query";

import { prefetchEndpoints } from "@/lib/prefetch";

import { BitcoinView } from "./bitcoin-view";

export default async function BitcoinPage() {
  const state = await prefetchEndpoints([
    "fear-greed",
    "mvrv",
    "bitcoin-historical",
  ]);

  return (
    <HydrationBoundary state={state}>
      <BitcoinView />
    </HydrationBoundary>
  );
}
