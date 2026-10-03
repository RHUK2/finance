import { HydrationBoundary } from '@tanstack/react-query';

import { pageMetadata } from '@/lib/nav';
import { prefetchEndpoints } from '@/lib/prefetch';

import { BitcoinView } from './bitcoin-view';

export const metadata = pageMetadata('/');

export default async function BitcoinPage() {
  const state = await prefetchEndpoints(['fear-greed', 'mvrv', 'bitcoin-historical', 'strategy', 'market']);

  return (
    <HydrationBoundary state={state}>
      <BitcoinView />
    </HydrationBoundary>
  );
}
