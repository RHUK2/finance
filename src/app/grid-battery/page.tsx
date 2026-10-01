import { pageMetadata } from '@/lib/nav';

import { GridBatteryView } from './grid-battery-view';

export const metadata = pageMetadata('/grid-battery');

export default function GridBatteryPage() {
  return <GridBatteryView />;
}
