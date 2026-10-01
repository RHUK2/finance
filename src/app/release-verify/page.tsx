import { pageMetadata } from '@/lib/nav';

import { ReleaseVerifyView } from './release-verify-view';

export const metadata = pageMetadata('/release-verify');

export default function ReleaseVerifyPage() {
  return <ReleaseVerifyView />;
}
