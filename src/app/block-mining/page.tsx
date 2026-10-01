import { pageMetadata } from '@/lib/nav';

import { BlockMiningView } from './block-mining-view';

export const metadata = pageMetadata('/block-mining');

export default function BlockMiningPage() {
  return <BlockMiningView />;
}
