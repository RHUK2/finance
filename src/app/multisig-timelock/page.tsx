import { pageMetadata } from '@/lib/nav';

import { MultisigTimelockView } from './multisig-timelock-view';

export const metadata = pageMetadata('/multisig-timelock');

export default function MultisigTimelockPage() {
  return <MultisigTimelockView />;
}
