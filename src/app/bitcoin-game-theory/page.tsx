import { pageMetadata } from '@/lib/nav';

import { BitcoinGameTheoryView } from './bitcoin-game-theory-view';

export const metadata = pageMetadata('/bitcoin-game-theory');

export default function BitcoinGameTheoryPage() {
  return <BitcoinGameTheoryView />;
}
