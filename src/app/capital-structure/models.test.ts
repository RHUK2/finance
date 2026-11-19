import { describe, expect, it } from 'vitest';
import {
  ASSETS,
  BREAKEVEN,
  REDEEM,
  firmValue,
  hybrid,
  leverage,
  netIncome,
  taxShield,
  waterfall,
  saleProceedsNote,
} from './models';

describe('자본구조', () => {
  it.each([
    [-50, -70],
    [0, -20],
    [10, -10],
    [20, 0],
    [30, 8],
  ])('영업이익 %s억에서 이자 20억 차감 후 양의 이익에만 과세한다', (ebit, expected) => {
    expect(netIncome(ebit, 20)).toBe(expected);
  });
  it('무차입 ROE는 세후 ROA와 같고 적자에는 과세하지 않는다', () => {
    for (const ebit of [-50, 0, 100, 200]) {
      const r = leverage(0, 5, ebit);
      expect(r.roe).toBe(r.roa);
      expect(r.coverage).toBeNull();
    }
    expect(netIncome(10, 20)).toBe(-10);
    expect(leverage(40, 5, 10).realizedShield).toBeCloseTo(2);
    expect(leverage(40, 5, 0).realizedShield).toBe(0);
  });
  it('연간 방패와 영업이익 배분을 보존하고 세율 0에서도 곤경비용은 남는다', () => {
    const r = taxShield(40, 20, 150, 5);
    expect(r.annualShield).toBeCloseTo(r.interest * 0.2);
    expect(r.interest + r.tax + r.net).toBeCloseTo(150);
    expect(taxShield(40, 0, 150, 5).annualShield).toBe(0);
    expect(firmValue(40, 0)).toBeCloseTo(992.32);
    expect(firmValue(0, 20)).toBe(1000);
  });
  it('무차입에서는 세율 0~30% 모두 올해 아낀 법인세가 정확히 0이다', () => {
    for (let taxRate = 0; taxRate <= 30; taxRate++) {
      expect(taxShield(0, taxRate, 150, 5).annualShield).toBe(0);
    }
  });
  it('청산 배분은 0~1100억 전 구간에서 보존되고 앞 청구권부터 채운다', () => {
    const tiers = [40, 300, 260, 100, 100, 300].map((claim) => ({ claim }));
    for (let proceeds = 0; proceeds <= 1100; proceeds += 25) {
      const { rows } = waterfall(tiers, proceeds);
      expect(rows.reduce((sum, r) => sum + r.paid, 0)).toBe(proceeds);
      rows.forEach((r, i) => {
        expect(r.paid).toBeGreaterThanOrEqual(0);
        expect(r.paid).toBeLessThanOrEqual(r.claim);
        if (r.paid > 0) expect(rows.slice(0, i).every((prior) => prior.rate === 100)).toBe(true);
      });
    }
    expect(waterfall(tiers, 340).fulcrum?.claim).toBe(260);
    expect(waterfall(tiers, 1100).fulcrum).toBeUndefined();
  });
  it('분기점에서 전환과 상환 가치가 같고 그 전후로 선택이 바뀐다', () => {
    expect(hybrid(BREAKEVEN).convValue).toBeCloseTo(REDEEM);
    expect(hybrid(BREAKEVEN).priceConverted).toBeCloseTo(hybrid(BREAKEVEN).priceRedeemed);
    expect(hybrid(BREAKEVEN - 1).converts).toBe(false);
    expect(hybrid(BREAKEVEN + 1).converts).toBe(true);
    for (const value of [200, 1500, BREAKEVEN, 5000]) {
      const r = hybrid(value);
      expect(r.holder + r.existing).toBeCloseTo(value);
    }
  });
});

describe('매각 대금과 장부가 비교 문구', () => {
  const difference = 25;
  const differencePct = Math.round((difference / ASSETS) * 100);

  it.each([
    [ASSETS - difference, `장부가 대비 ${differencePct}% 할인된 값이다`],
    [ASSETS, '장부가와 같다'],
    [ASSETS + difference, `장부가 대비 ${differencePct}% 웃돈이 붙은 값이다`],
  ])('%s억에서 할인·동률·웃돈을 구분한다', (proceeds, text) => {
    expect(saleProceedsNote(proceeds)).toBe(text);
  });
});
