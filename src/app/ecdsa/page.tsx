import { pageMetadata } from '@/lib/nav';

import { EcdsaView } from './ecdsa-view';

export const metadata = pageMetadata('/ecdsa');

export default function EcdsaPage() {
  return <EcdsaView />;
}
