import { describe, expect, it } from 'vitest';

import { depositLoan, depositPriority, gapInvestment, reverseJeonse } from './models';

describe('전세 모델', () => {
  it('매매가·전세가율 슬라이더의 모든 동률과 양옆을 구분한다', () => {
    for (let price = 2; price <= 20; price += 0.5) {
      for (let ratio = 50; ratio <= 95; ratio++) {
        const equal = reverseJeonse(price, ratio, 100 - ratio, 20);
        expect(equal.atParity).toBe(true);
        expect(equal.underwater).toBe(0);
        expect(equal.depositRatio).toBeCloseTo(100);
        expect(reverseJeonse(price, ratio, 99 - ratio, 20).underwater).toBe(0);
        const below = reverseJeonse(price, ratio, 101 - ratio, 20);
        expect(below.atParity).toBe(false);
        expect(below.underwater).toBeCloseTo(price / 100);
      }
    }
  });

  it('시세 하락에 따른 반환 부족액과 깡통 부족액을 구분한다', () => {
    expect(reverseJeonse(6, 80, 0, 0)).toMatchObject({ refundGap: 0, underwater: 0 });
    const result = reverseJeonse(6, 80, 25, 20);
    expect(result.refundGap).toBeCloseTo(0.96);
    expect(result.underwater).toBeCloseTo(0.3);
    expect(result.marketRatio).toBeCloseTo((3.84 / 4.5) * 100);
  });

  it.each([
    [false, false, false, 0, 0, 4, 2],
    [false, false, true, 0, 0, 4, 2],
    [false, true, false, 0, 0, 4, 2],
    [false, true, true, 3, 0, 1, 2],
    [true, false, false, 0, 0, 4, 2],
    [true, false, true, 0, 0, 4, 2],
    [true, true, false, 0, 4, 0, 2],
    [true, true, true, 4, 0, 0, 1],
  ] as const)(
    '선후·전입·확정일자 %s/%s/%s의 배당과 인수',
    (senior, moveIn, fixedDate, distributed, assumed, lost, bankPaid) => {
      expect(depositPriority(4, 2, 5, senior, moveIn, fixedDate)).toMatchObject({
        distributed,
        assumed,
        lost,
        bankPaid,
      });
      for (const salePrice of [0.5, 2, 5, 15]) {
        const r = depositPriority(4, 2, salePrice, senior, moveIn, fixedDate);
        expect(r.distributed + r.assumed + r.lost).toBe(4);
        expect(r.distributed + r.bankPaid).toBeLessThanOrEqual(salePrice);
        expect(r.recovered).toBe(4 - r.lost);
      }
    },
  );

  it('전세 기회비용과 연 월세의 동률 및 차이를 만원으로 계산한다', () => {
    expect(depositLoan(4, 3, 100)).toMatchObject({ jeonseCost: 1200, rentCost: 1200, conversionRate: 3, tie: true });
    expect(depositLoan(4, 3.5, 120).gap).toBe(40);
    expect(depositLoan(4, 4, 100).gap).toBe(-400);
  });

  it.each([-30, 0, 10])('갭투자 변동률 %s의 손익을 자기자본에 귀속한다', (change) => {
    const r = gapInvestment(6, 80, change);
    expect(r.deposit + r.gap).toBe(6);
    expect(r.leverage).toBeCloseTo(5);
    expect(r.profit).toBeCloseTo((6 * change) / 100);
    expect(r.roe).toBeCloseTo(change * 5);
  });
});
