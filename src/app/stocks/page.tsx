import { HydrationBoundary } from '@tanstack/react-query';

import { pageMetadata } from '@/lib/nav';
import { prefetchEndpoints } from '@/lib/prefetch';

import { StocksView } from './stocks-view';

export const metadata = pageMetadata('/stocks');

export default async function StocksPage() {
  const state = await prefetchEndpoints(['stocks', 'market']);

  return (
    <HydrationBoundary state={state}>
      <StocksView />
    </HydrationBoundary>
  );
}
