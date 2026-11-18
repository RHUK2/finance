import { expect, it } from 'vitest';
import { formatValue, MAX_CUPS, SITUATIONS, waterMarginalWon, waterTotalWon } from './models';

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

it.each([
  [0, '0원'],
  [0.2, '1원 미만'],
  [0.99, '1원 미만'],
  [1, '1원'],
  [9999.5, '10,000원'],
  [1e8, '1.00억'],
] as const)('formatValue(%s)는 %s로 표시한다', (won, expected) => {
  expect(formatValue(won)).toBe(expected);
});

it('도시에서 20잔째의 양수 지불의사는 0원으로 표시하지 않는다', () => {
  expect(formatValue(waterMarginalWon(MAX_CUPS, SITUATIONS.city.decay))).toBe('1원 미만');
});
