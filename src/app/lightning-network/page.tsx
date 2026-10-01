import { pageMetadata } from '@/lib/nav';

import { LightningNetworkView } from './lightning-network-view';

export const metadata = pageMetadata('/lightning-network');

export default function LightningNetworkPage() {
  return <LightningNetworkView />;
}
