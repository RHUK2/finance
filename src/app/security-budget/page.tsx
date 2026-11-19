import { pageMetadata } from '@/lib/nav';

import { CURRENT_ERA } from './models';
import { SecurityBudgetView } from './security-budget-view';

export const metadata = pageMetadata('/security-budget');

export default function SecurityBudgetPage() {
  return <SecurityBudgetView currentEra={CURRENT_ERA} />;
}
