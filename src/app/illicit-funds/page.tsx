import { pageMetadata } from '@/lib/nav';

import { IllicitFundsView } from './illicit-funds-view';

export const metadata = pageMetadata('/illicit-funds');

export default function IllicitFundsPage() {
  return <IllicitFundsView />;
}
