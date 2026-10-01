import { pageMetadata } from '@/lib/nav';

import { CorporationView } from './corporation-view';

export const metadata = pageMetadata('/corporation');

export default function CorporationPage() {
  return <CorporationView />;
}
