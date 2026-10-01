import { HydrationBoundary } from '@tanstack/react-query';

import { pageMetadata } from '@/lib/nav';
import { prefetchEndpoints } from '@/lib/prefetch';

import { EconomyView } from './economy-view';

export const metadata = pageMetadata('/economy');

export default async function EconomyPage() {
  const state = await prefetchEndpoints(['economy', 'fred']);

  return (
    <HydrationBoundary state={state}>
      <EconomyView />
    </HydrationBoundary>
  );
}
