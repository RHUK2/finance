import { pageMetadata } from '@/lib/nav';

import { MoneyCreationView } from './money-creation-view';

export const metadata = pageMetadata('/money-creation');

export default function MoneyCreationPage() {
  return <MoneyCreationView />;
}
