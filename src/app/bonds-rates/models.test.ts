import { describe, expect, it } from 'vitest';

import { bondPrice, curveYields, I10, I2, modifiedDuration, rateShock, spread10y2y, TENORS } from './models';

// 티켓 28: 역전 곡선은 0에서 잘린다. 단기금리가 낮으면 스프레드가 0이 되어 역전도 정상도 아니다.
describe('수익률 곡선', () => {
  it('2년물·10년물 자리', () => {
    expect(TENORS[I2].label).toBe('2Y');
    expect(TENORS[I10].label).toBe('10Y');
  });

  it('역전 × 단기 0·0.25는 스프레드가 정확히 0이다', () => {
    expect(curveYields('inverted', 0)).toEqual([0, 0, 0, 0, 0]);
    expect(spread10y2y(curveYields('inverted', 0))).toBe(0);
    expect(spread10y2y(curveYields('inverted', 0.25))).toBe(0);
  });

  it('역전 × 단기 0.5부터 스프레드가 음수다', () => {
    for (let s = 0.5; s <= 10; s += 0.25) expect(spread10y2y(curveYields('inverted', s))).toBeLessThan(0);
  });

  it('정상 +0.90, 평탄 +0.10은 단기금리와 무관하다', () => {
    for (let s = 0; s <= 10; s += 0.25) {
      expect(spread10y2y(curveYields('normal', s))).toBeCloseTo(0.9, 9);
      expect(spread10y2y(curveYields('flat', s))).toBeCloseTo(0.1, 9);
    }
  });

  it('금리는 음수가 되지 않는다', () => {
    for (const shape of ['normal', 'flat', 'inverted'] as const)
      for (let s = 0; s <= 2; s += 0.25) expect(Math.min(...curveYields(shape, s))).toBeGreaterThanOrEqual(0);
  });
});

describe('채권 가격', () => {
  it('표면금리 = 시장금리면 액면가에 팔린다', () => {
    for (const years of [1, 5, 30]) {
      expect(bondPrice({ face: 10_000, couponRate: 0.04, years, ytm: 0.04 })).toBeCloseTo(10_000, 6);
    }
  });

  it('시장금리가 오르면 가격이 내리고, 수정 듀레이션이 그 1차 근사다', () => {
    const bond = { face: 10_000, couponRate: 0.035, years: 10, ytm: 0.035 };
    const up = bondPrice({ ...bond, ytm: bond.ytm + 0.0001 });
    expect(up).toBeLessThan(bondPrice(bond));
    const approx = -modifiedDuration(bond) * 0.0001;
    expect((up - bondPrice(bond)) / bondPrice(bond)).toBeCloseTo(approx, 6);
  });

  it('무이표채의 맥컬리 듀레이션은 만기 그 자체다', () => {
    const zero = { face: 10_000, couponRate: 0, years: 7, ytm: 0.05 };
    expect(modifiedDuration(zero) * (1 + zero.ytm)).toBeCloseTo(7, 9);
  });

  it('볼록성: 금리가 어느 쪽으로 움직여도 실제 가격이 듀레이션 근사보다 높다', () => {
    const bond = { face: 10_000, couponRate: 0.035, years: 30, ytm: 0.035 };
    expect(rateShock(bond, 0.02).convexityGap).toBeGreaterThan(0);
    expect(rateShock(bond, -0.02).convexityGap).toBeGreaterThan(0);
  });
});
