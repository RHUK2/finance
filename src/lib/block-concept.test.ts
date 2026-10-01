import { describe, expect, it } from 'vitest';

import { RETARGET_INTERVAL, TARGET_RETARGET_DAYS } from './bitcoin-models';
import { retargetMultiplier } from './block-concept';

// 기대값은 docs/fact-check-log.md 「블록·합의」다: 2016블록, 목표 14일, 조정 폭 ±4배.
describe('난이도 조정', () => {
  it('2016블록, 목표 기간 14일', () => {
    expect(RETARGET_INTERVAL).toBe(2016);
    expect(TARGET_RETARGET_DAYS).toBe(14);
  });

  it.each([
    [14, 1],
    [7, 2],
    [28, 0.5],
    [3.5, 4],
    [56, 0.25],
  ])('%d일 걸리면 × %d', (days, multiplier) => {
    expect(retargetMultiplier(days)).toBeCloseTo(multiplier, 12);
  });

  // 티켓 85: 슬라이더 2~70일 양 끝이 상하한에 걸린다.
  it('조정 폭은 0.25~4배로 묶인다', () => {
    expect(retargetMultiplier(2)).toBe(4);
    expect(retargetMultiplier(70)).toBe(0.25);
    for (let d = 1; d <= 100; d += 0.5) {
      expect(retargetMultiplier(d)).toBeGreaterThanOrEqual(0.25);
      expect(retargetMultiplier(d)).toBeLessThanOrEqual(4);
    }
  });
});
