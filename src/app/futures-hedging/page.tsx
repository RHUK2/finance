import { pageMetadata } from '@/lib/nav';

import { FuturesHedgingView } from './futures-hedging-view';

export const metadata = pageMetadata('/futures-hedging');

export default function FuturesHedgingPage() {
  return <FuturesHedgingView />;
}
