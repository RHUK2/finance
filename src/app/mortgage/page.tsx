import { pageMetadata } from '@/lib/nav';

import { MortgageView } from './mortgage-view';

export const metadata = pageMetadata('/mortgage');

export default function MortgagePage() {
  return <MortgageView />;
}
