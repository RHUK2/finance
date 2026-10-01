import { pageMetadata } from '@/lib/nav';

import { BitcoinHistoryView } from './bitcoin-history-view';

export const metadata = pageMetadata('/bitcoin-history');

export default function BitcoinHistoryPage() {
  return <BitcoinHistoryView />;
}
