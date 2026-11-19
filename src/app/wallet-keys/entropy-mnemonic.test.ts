import { isValidElement, type ReactNode } from 'react';
import { expect, it, vi } from 'vitest';

import { Select } from '@/components/ui/select';
import { EntropyMnemonic } from './entropy-mnemonic';

function selectChange(node: ReactNode): ((value: string | null) => void) | undefined {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = selectChange(child);
      if (found) return found;
    }
  }
  if (!isValidElement<{ children?: ReactNode; onValueChange?: (v: string | null) => void }>(node)) return;
  return node.type === Select ? node.props.onValueChange : selectChange(node.props.children);
}

it('ignores empty select values and forwards a selected entropy strength', () => {
  const onChangeBits = vi.fn();
  const change = selectChange(
    EntropyMnemonic({ bits: 128, entropyHex: '0'.repeat(32), words: [], onChangeBits, onRegen: vi.fn() }),
  );
  expect(change).toBeDefined();
  change!(null);
  change!('');
  expect(onChangeBits).not.toHaveBeenCalled();
  change!('256');
  expect(onChangeBits).toHaveBeenCalledWith(256);
});
