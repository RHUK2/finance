import { pageMetadata } from '@/lib/nav';

import { P2pNetworkView } from './p2p-network-view';

export const metadata = pageMetadata('/p2p-network');

export default function P2pNetworkPage() {
  return <P2pNetworkView />;
}
