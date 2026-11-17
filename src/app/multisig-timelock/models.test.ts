import { describe, expect, it } from 'vitest';
import { canSpendInNextBlock, multisigScriptSig } from './models';

describe('다음 블록 포함 가능 여부', () => {
  it.each([
    [99, false],
    [100, true],
    [101, true],
  ] as const)('CLTV: 팁 높이 %i에서 해제 높이 100의 다음 블록 지출은 %s', (currentHeight, expected) => {
    expect(canSpendInNextBlock({ type: 'cltv', currentHeight, unlockHeight: 100 })).toBe(expected);
  });
  it.each([
    [143, false],
    [144, true],
    [145, true],
  ] as const)('CSV: 포함 블록 1확인 기준 %i확인에서 요구치 144의 다음 블록 지출은 %s', (confirmations, expected) => {
    expect(canSpendInNextBlock({ type: 'csv', confirmations, requiredBlocks: 144 })).toBe(expected);
  });
  it('CSV: 요구치 0이면 0확인에서도 다음 블록에 포함할 수 있다', () => {
    expect(canSpendInNextBlock({ type: 'csv', confirmations: 0, requiredBlocks: 0 })).toBe(true);
  });
});

describe('다중서명 scriptSig', () => {
  it('M보다 많이 서명해도 공개키 순서로 앞 M개만 싣는다', () => {
    expect(multisigScriptSig([true, true, true], 2)).toBe('OP_0 <sigA> <sigB>');
    expect(multisigScriptSig([false, true, true, false, true], 2)).toBe('OP_0 <sigB> <sigC>');
  });

  it('M개 미만이면 있는 서명만 싣고 서명을 만들어 채우지 않는다', () => {
    expect(multisigScriptSig([false, false, true], 2)).toBe('OP_0 <sigC>');
    expect(multisigScriptSig([false, false, false], 2)).toBe('OP_0 ');
  });

  it('M이 바뀌면 같은 서명 목록에서 싣는 개수가 바뀐다', () => {
    expect(multisigScriptSig([true, false, true], 1)).toBe('OP_0 <sigA>');
    expect(multisigScriptSig([true, false, true], 2)).toBe('OP_0 <sigA> <sigC>');
  });
});
