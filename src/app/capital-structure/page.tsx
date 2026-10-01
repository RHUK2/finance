import { pageMetadata } from '@/lib/nav';

import { CapitalStructureView } from './capital-structure-view';

export const metadata = pageMetadata('/capital-structure');

export default function CapitalStructurePage() {
  return <CapitalStructureView />;
}
