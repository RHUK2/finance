import { pageMetadata } from '@/lib/nav';

import { TransactionsView } from './transactions-view';

export const metadata = pageMetadata('/transactions');

export default function TransactionsPage() {
  return <TransactionsView />;
}
