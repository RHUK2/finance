import { expect, it } from 'vitest';
import { MAX_CUPS, SITUATIONS, waterMarginalWon, waterTotalWon } from './models';

it('n번째 잔은 보유 n잔과 n-1잔의 총 지불의사 차이다', () => {
  for (const { decay } of Object.values(SITUATIONS)) {
    expect(waterTotalWon(0, decay)).toBe(0);
    for (let n = 1; n <= MAX_CUPS; n++) {
      expect(waterTotalWon(n, decay) - waterTotalWon(n - 1, decay)).toBeCloseTo(waterMarginalWon(n, decay), 5);
      expect(waterMarginalWon(n + 1, decay)).toBeLessThan(waterMarginalWon(n, decay));
    }
  }
  expect(waterMarginalWon(3, SITUATIONS.city.decay)).toBeCloseTo(12_250_000);
  expect(waterMarginalWon(4, SITUATIONS.city.decay)).toBeCloseTo(4_287_500);
  expect(waterMarginalWon(3, SITUATIONS.city.decay)).toBeGreaterThan(SITUATIONS.city.diamondWon);
  expect(waterMarginalWon(4, SITUATIONS.city.decay)).toBeLessThan(SITUATIONS.city.diamondWon);
});
