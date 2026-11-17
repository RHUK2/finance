import { describe, expect, it } from 'vitest';

import { pricePerPointOfP, probabilityTrajectory, realizedVol, regimeImpliedPrice, SUPPLY } from './models';

describe('두 체제 가격 환산', () => {
  it('성공 시 가격에 성공 확률을 곱한다', () => {
    const cap = SUPPLY * 100_000;
    expect(regimeImpliedPrice(0, cap)).toEqual({ winPrice: 100_000, implied: 0 });
    expect(regimeImpliedPrice(0.05, cap).implied).toBe(5000);
    expect(regimeImpliedPrice(1, cap).implied).toBe(100_000);
    expect(pricePerPointOfP(0.05)).toBeCloseTo(0.2);
  });
});

describe('성공 확률 궤적', () => {
  it('시작값과 길이를 지키고 같은 인자에서 같은 경로를 만든다', () => {
    const options = { seed: 42, start: 0.3, steps: 60 };
    const path = probabilityTrajectory(0.04, 0.002, options);
    expect(path).toHaveLength(61);
    expect(path[0]).toBe(0.3);
    expect(path).toEqual(probabilityTrajectory(0.04, 0.002, options));
    expect(probabilityTrajectory(0.04, 0.002, { ...options, steps: 0 })).toEqual([0.3]);
    expect(probabilityTrajectory(0.04, 0.002)).toHaveLength(241);
  });

  it('상하한에서 클램프하고, 잡음이 있으면 하한에 흡수되지 않는다', () => {
    const options = { seed: 42, start: 0.05, steps: 100 };
    expect(probabilityTrajectory(0, -1, options).slice(1)).toEqual(Array(100).fill(0.002));
    expect(probabilityTrajectory(0, 1, options).slice(1)).toEqual(Array(100).fill(1));
    const path = probabilityTrajectory(2, 0, { ...options, start: 0.002 });
    expect(Math.min(...path)).toBe(0.002);
    expect(Math.max(...path)).toBe(1);
    expect(path.some((p, i) => i > 0 && path[i - 1] === 0.002 && p > 0.002)).toBe(true);
  });
});

describe('최근 실현 변동성', () => {
  it('표본이 두 개 미만이거나 수익률이 일정하면 0이다', () => {
    expect(realizedVol([], 20)).toBe(0);
    expect(realizedVol([0.1], 20)).toBe(0);
    expect(realizedVol([0.125, 0.125, 0.125], 20)).toBe(0);
  });

  it('최근 window개만 사용해 라운드당 모집단 표준편차를 구한다', () => {
    expect(realizedVol([100, -0.1, 0.1], 2)).toBeCloseTo(0.1);
    expect(realizedVol([-0.1, 0.1], 20)).toBeCloseTo(0.1);
  });
});
