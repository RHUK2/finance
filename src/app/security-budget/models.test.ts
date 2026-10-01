import { describe, expect, it } from 'vitest';

import { BLOCKS_PER_YEAR, CURRENT_ERA, cumulativeSupply, eraStartYear, LAST_SUBSIDY_ERA, subsidyAt } from './models';

// 발행 스케줄은 프로토콜이 정한다. 사토시 정수 나눗셈이라 50 BTC = 5e9 sat을 33번 자르면 0이다.
describe('보조금', () => {
  it('시대 4는 3.125 BTC', () => {
    expect(subsidyAt(0)).toBe(50);
    expect(subsidyAt(4)).toBe(3.125);
  });

  // 티켓 25: 마지막 1사토시는 시대 32, 0이 되는 것은 시대 33이다.
  it('시대 31·32·33은 2 sat·1 sat·0', () => {
    expect(LAST_SUBSIDY_ERA).toBe(32);
    expect(Math.round(subsidyAt(31) * 1e8)).toBe(2);
    expect(Math.round(subsidyAt(32) * 1e8)).toBe(1);
    expect(subsidyAt(33)).toBe(0);
    expect(subsidyAt(LAST_SUBSIDY_ERA + 1)).toBe(0);
  });

  it('누적 공급은 20,999,999.9769 BTC에서 멈추고 2,100만을 넘지 않는다', () => {
    expect(cumulativeSupply(33)).toBeCloseTo(20_999_999.9769, 4);
    expect(cumulativeSupply(40)).toBe(cumulativeSupply(33));
    expect(cumulativeSupply(33)).toBeLessThan(21_000_000);
  });
});

describe('시대 시작 연도', () => {
  it('지난 반감기는 실측 연도다', () => {
    expect([0, 1, 2, 3, 4].map(eraStartYear)).toEqual([2009, 2012, 2016, 2020, 2024]);
    expect(CURRENT_ERA).toBe(4);
  });

  it('앞으로의 시대는 약 4년씩, 보조금이 0이 되는 해는 2140년 언저리', () => {
    expect([5, 6].map(eraStartYear)).toEqual([2028, 2032]);
    expect([31, 32, 33].map(eraStartYear)).toEqual([2132, 2136, 2140]);
  });

  it('1년 = 144블록 × 365일', () => {
    expect(BLOCKS_PER_YEAR).toBe(52_560);
  });
});
