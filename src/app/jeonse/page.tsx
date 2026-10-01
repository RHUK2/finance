import { pageMetadata } from '@/lib/nav';

import { JeonseView } from './jeonse-view';

export const metadata = pageMetadata('/jeonse');

export default function JeonsePage() {
  return <JeonseView />;
}
