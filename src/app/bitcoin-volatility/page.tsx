import { pageMetadata } from '@/lib/nav';

import { BitcoinVolatilityView } from './bitcoin-volatility-view';

export const metadata = pageMetadata('/bitcoin-volatility');

export default function BitcoinVolatilityPage() {
  return <BitcoinVolatilityView />;
}
