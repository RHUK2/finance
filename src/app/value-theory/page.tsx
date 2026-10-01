import { pageMetadata } from '@/lib/nav';

import { ValueTheoryView } from './value-theory-view';

export const metadata = pageMetadata('/value-theory');

export default function ValueTheoryPage() {
  return <ValueTheoryView />;
}
