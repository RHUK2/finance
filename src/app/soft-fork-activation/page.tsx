import { pageMetadata } from '@/lib/nav';

import { SoftForkActivationView } from './soft-fork-activation-view';

export const metadata = pageMetadata('/soft-fork-activation');

export default function SoftForkActivationPage() {
  return <SoftForkActivationView />;
}
