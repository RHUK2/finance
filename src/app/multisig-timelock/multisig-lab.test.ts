import { expect, it } from 'vitest';

import { formatMultisigScriptSig } from './multisig-lab';
import { multisigScriptSig } from './models';

it.each(['OP_0', 'OP_0 '])('shows one space before the unsigned label for %j', (scriptSig) => {
  expect(formatMultisigScriptSig(scriptSig, 0)).toBe('OP_0 (서명 없음)');
});

it('formats the unsigned model result', () => {
  expect(formatMultisigScriptSig(multisigScriptSig([false, false, false], 2), 0)).toBe('OP_0 (서명 없음)');
});

it('keeps signed scripts unchanged', () => {
  const scriptSig = multisigScriptSig([true, false, true], 2);
  expect(formatMultisigScriptSig(scriptSig, 2)).toBe('OP_0 <sigA> <sigC>');
});
