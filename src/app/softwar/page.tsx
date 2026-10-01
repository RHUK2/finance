import { pageMetadata } from '@/lib/nav';

import { SoftwarView } from './softwar-view';

export const metadata = pageMetadata('/softwar');

export default function SoftwarPage() {
  return <SoftwarView />;
}
