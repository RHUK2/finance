import { pageMetadata } from '@/lib/nav';

import { PrivacyView } from './privacy-view';

export const metadata = pageMetadata('/privacy');

export default function PrivacyPage() {
  return <PrivacyView />;
}
