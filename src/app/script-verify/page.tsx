import { pageMetadata } from '@/lib/nav';

import { ScriptVerifyView } from './script-verify-view';

export const metadata = pageMetadata('/script-verify');

export default function ScriptVerifyPage() {
  return <ScriptVerifyView />;
}
