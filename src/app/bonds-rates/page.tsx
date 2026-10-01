import { pageMetadata } from '@/lib/nav';

import { BondsRatesView } from './bonds-rates-view';

export const metadata = pageMetadata('/bonds-rates');

export default function BondsRatesPage() {
  return <BondsRatesView />;
}
