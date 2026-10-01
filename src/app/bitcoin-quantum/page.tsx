import { pageMetadata } from '@/lib/nav';

import { BitcoinQuantumView } from './bitcoin-quantum-view';

export const metadata = pageMetadata('/bitcoin-quantum');

export default function BitcoinQuantumPage() {
  return <BitcoinQuantumView />;
}
