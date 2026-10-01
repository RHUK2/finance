import { describe, expect, it } from 'vitest';

import {
  compoundDeposit,
  depositIndex,
  KR_MIN_WAGE,
  KR_WAGE_LAST_YEAR,
  minWageAt,
  type Point,
  US_MIN_WAGE,
} from './inflation-models';

// 기대값은 docs/fact-check-log.md 「최저임금」이다.
describe('최저임금 표', () => {
  it('한국 2024~2027년', () => {
    expect(minWageAt(KR_MIN_WAGE, 2024)).toBe(9_860);
    expect(minWageAt(KR_MIN_WAGE, 2025)).toBe(10_030);
    expect(minWageAt(KR_MIN_WAGE, 2026)).toBe(10_320);
    expect(minWageAt(KR_MIN_WAGE, 2027)).toBe(10_700);
    expect(KR_WAGE_LAST_YEAR).toBe(2027);
  });

  it('미국 연방은 2009년 $7.25 이후 변동 없다 (표에 없는 해는 안 바뀐 것)', () => {
    expect(US_MIN_WAGE.at(-1)).toEqual({ year: 2009, wage: 7.25 });
    expect(minWageAt(US_MIN_WAGE, 2008)).toBe(6.55);
    expect(minWageAt(US_MIN_WAGE, 2009)).toBe(7.25);
    expect(minWageAt(US_MIN_WAGE, 2026)).toBe(7.25);
  });

  it('미국 1974년 $2.00 → 1975년 $2.10 → 1976년 $2.30', () => {
    expect(minWageAt(US_MIN_WAGE, 1974)).toBe(2.0);
    expect(minWageAt(US_MIN_WAGE, 1975)).toBe(2.1);
    expect(minWageAt(US_MIN_WAGE, 1976)).toBe(2.3);
  });

  it('표보다 앞선 해는 null', () => {
    expect(minWageAt(KR_MIN_WAGE, 1999)).toBeNull();
    expect(minWageAt(US_MIN_WAGE, 1960)).toBeNull();
  });

  it('두 표 모두 연도 오름차순이고 값이 줄지 않는다', () => {
    for (const table of [KR_MIN_WAGE, US_MIN_WAGE]) {
      for (let i = 1; i < table.length; i++) {
        expect(table[i].year).toBeGreaterThan(table[i - 1].year);
        expect(table[i].wage).toBeGreaterThanOrEqual(table[i - 1].wage);
      }
    }
  });
});

// 티켓 88: 카드와 차트가 한 누적에서 나온다. 카드는 마지막 관측월 이자까지, 차트는 각 관측월 초.
describe('예금 누적', () => {
  const rates: Point[] = [
    { time: '2026-01-01', value: 12 },
    { time: '2026-02-01', value: 12 },
  ];

  it('연 12% 두 달: 카드 102.01, 차트 [100, 101]', () => {
    expect(compoundDeposit(100, rates, 2026)).toBeCloseTo(102.01, 10);
    expect(depositIndex(rates, 2026).map((p) => p.value)).toEqual([100, 101]);
  });

  it('카드 = 차트 끝점 × 마지막 관측월 한 달 이자', () => {
    const long: Point[] = Array.from({ length: 36 }, (_, i) => ({
      time: `${2020 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}-01`,
      value: 1 + (i % 7) * 0.5,
    }));
    const index = depositIndex(long, 2020, 1_000);
    const card = compoundDeposit(1_000, long, 2020)!;
    expect(card).toBeCloseTo(index.at(-1)!.value * (1 + long.at(-1)!.value / 100 / 12), 9);
  });

  it('범위 밖이면 null·빈 배열, 첫 관측 뒤의 해는 원금 그대로', () => {
    expect(compoundDeposit(100, rates, 2025)).toBeNull();
    expect(depositIndex(rates, 2025)).toEqual([]);
    expect(compoundDeposit(100, [], 2026)).toBeNull();
    expect(compoundDeposit(100, undefined, 2026)).toBeNull();
    expect(compoundDeposit(100, rates, 2027)).toBe(100);
  });
});
