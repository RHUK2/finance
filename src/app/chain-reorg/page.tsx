import { pageMetadata } from '@/lib/nav';

import { ChainReorgView } from './chain-reorg-view';

export const metadata = pageMetadata('/chain-reorg');

export default function ChainReorgPage() {
  return <ChainReorgView />;
}
