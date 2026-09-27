import { HydrationBoundary } from '@tanstack/react-query';

import { prefetchEndpoints } from '@/lib/prefetch';

import { StocksView } from './stocks-view';

export default async function StocksPage() {
  const state = await prefetchEndpoints(['stocks']);

  return (
    <HydrationBoundary state={state}>
      <StocksView />
    </HydrationBoundary>
  );
}
