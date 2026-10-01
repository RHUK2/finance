import { HydrationBoundary } from '@tanstack/react-query';

import { pageMetadata } from '@/lib/nav';
import { prefetchEndpoints } from '@/lib/prefetch';

import { InflationView } from './inflation-view';

export const metadata = pageMetadata('/inflation');

export default async function InflationPage() {
  const state = await prefetchEndpoints(['inflation-data', 'inflation-data-kr', 'bitcoin-historical']);

  return (
    <HydrationBoundary state={state}>
      <InflationView />
    </HydrationBoundary>
  );
}
