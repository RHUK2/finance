import { describe, expect, it } from 'vitest';

import { buyOrRent, cumulativeInterest } from './models';

describe('매수·임차 비교', () => {
  it('무이자·집값 불변이면 세금과 기회비용만 매수 비용에 넣는다', () => {
    const interest = cumulativeInterest(60000, 0);
    expect(interest).toHaveLength(361);
    expect(interest.every((value) => value === 0)).toBe(true);
    const r = buyOrRent(60000, 5, 0, 60, 5, interest);
    expect(r.buyCost).toBeCloseTo(4710); // 취득세·교육세 660 + 보유세 450 + 기회비용 3600
    expect(r.jeonseCost).toBeCloseTo(5400);
    expect(r.rentCost).toBeCloseTo(8640); // 월세 8100 + 보증금 기회비용 540
  });

  it.each([1, 8, 30])('%s년의 손익분기 상승률을 넣으면 매수와 전세 비용이 같다', (years) => {
    const interest = cumulativeInterest(80000, 4);
    expect(interest[12]).toBeGreaterThan(0);
    expect(interest[360]).toBeGreaterThan(interest[12]);
    const r = buyOrRent(80000, years, 2, 65, 5.5, interest);
    expect(r.breakeven).not.toBeNull();
    const at = buyOrRent(80000, years, r.breakeven!, 65, 5.5, interest);
    expect(at.buyCost).toBeCloseTo(at.jeonseCost, 6);
    expect(buyOrRent(80000, years, r.breakeven! + 0.1, 65, 5.5, interest).buyCost).toBeLessThan(at.jeonseCost);
  });
});
