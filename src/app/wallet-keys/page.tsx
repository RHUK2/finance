import { pageMetadata } from '@/lib/nav';

import { WalletKeysView } from './wallet-keys-view';

export const metadata = pageMetadata('/wallet-keys');

export default function WalletKeysPage() {
  return <WalletKeysView />;
}
