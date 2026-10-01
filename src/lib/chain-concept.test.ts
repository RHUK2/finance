import { describe, expect, it } from 'vitest';

import { doubleSpendProbability, formatProbability, reversalProbability } from './chain-concept';

// 기대값은 docs/fact-check-log.md 「블록·합의」의 백서 11장 표(q = 0.1)다.
describe('doubleSpendProbability (백서의 z)', () => {
  it.each([
    [1, 2.0459e-1],
    [2, 5.0978e-2],
    [3, 1.3172e-2],
    [6, 2.428e-4],
    [10, 1.2414e-6],
  ])('q=0.1, z=%i → %d', (z, expected) => {
    const p = doubleSpendProbability(0.1, z);
    expect(Math.abs(p - expected) / expected).toBeLessThan(5e-4);
  });

  it('과반이면 시간이 걸릴 뿐 결국 따라잡는다', () => {
    expect(doubleSpendProbability(0.5, 6)).toBe(1);
    expect(doubleSpendProbability(0.6, 100)).toBe(1);
  });

  it('z가 늘수록 줄어든다', () => {
    for (let z = 1; z < 30; z++) {
      expect(doubleSpendProbability(0.3, z + 1)).toBeLessThan(doubleSpendProbability(0.3, z));
    }
  });
});

// 티켓 12·43: 확인 수는 담긴 블록을 1확인으로 센다. z = 확인 수 − 1.
describe('reversalProbability (확인 수)', () => {
  it('확인 0개·1개는 z ≤ 0이라 1이다', () => {
    expect(reversalProbability(0.1, 0)).toBe(1);
    expect(reversalProbability(0.1, 1)).toBe(1);
  });

  it('확인 6개는 백서 z = 5의 9.137e-4다', () => {
    const p = reversalProbability(0.1, 6);
    expect(p).toBeCloseTo(9.137e-4, 6);
    expect(p).toBe(doubleSpendProbability(0.1, 5));
    expect(formatProbability(p)).toBe('약 1,094분의 1');
  });

  it('확인 2개는 백서 z = 1의 2.0459e-1이다', () => {
    expect(reversalProbability(0.1, 2)).toBeCloseTo(0.20459, 5);
    expect(formatProbability(reversalProbability(0.1, 2))).toBe('20.5%');
  });

  it('공격자가 클수록 6확인도 뒤집힌다', () => {
    expect(formatProbability(reversalProbability(0.3, 6))).toBe('17.7%');
    expect(formatProbability(reversalProbability(0.45, 6))).toBe('79.0%');
  });
});

describe('formatProbability', () => {
  it('1% 이상은 백분율, 그 아래는 N분의 1', () => {
    expect(formatProbability(0.5)).toBe('50.0%');
    expect(formatProbability(0.01)).toBe('1.0%');
    expect(formatProbability(0.001)).toBe('약 1,000분의 1');
    expect(formatProbability(0)).toBe('0%에 근접');
  });
});
