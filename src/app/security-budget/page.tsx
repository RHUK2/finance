import { pageMetadata } from '@/lib/nav';

import { SecurityBudgetView } from './security-budget-view';

export const metadata = pageMetadata('/security-budget');

export default function SecurityBudgetPage() {
  return <SecurityBudgetView />;
}
