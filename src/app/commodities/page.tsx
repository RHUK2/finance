import { HydrationBoundary } from '@tanstack/react-query';

import { pageMetadata } from '@/lib/nav';
import { prefetchEndpoints } from '@/lib/prefetch';

import { CommoditiesView } from './commodities-view';

export const metadata = pageMetadata('/commodities');

export default async function CommoditiesPage() {
  const state = await prefetchEndpoints(['commodities']);

  return (
    <HydrationBoundary state={state}>
      <CommoditiesView />
    </HydrationBoundary>
  );
}
