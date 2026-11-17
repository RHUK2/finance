import { describe, expect, it } from 'vitest';
import { canSpendInNextBlock } from './models';

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
