import { describe, expect, it } from 'vitest';

import { limitedLiability, PERSONAL } from './models';

describe('유한책임과 개인 재산 손실', () => {
  it.each([
    [195, 5, '사업주 개인 재산으로 갚는다'],
    [200, 0, '이번에는 빚을 사업 재산으로 모두 갚았다'],
    [205, 0, '이번에는 빚을 사업 재산으로 모두 갚았다'],
  ])('개인사업자 재산 %s억에서 손실 0 경계와 문구를 맞춘다', (assets, personalBurden, personalLossNote) => {
    expect(limitedLiability(assets, 200, false, false)).toMatchObject({ personalBurden, personalLossNote });
    expect(limitedLiability(assets, 200, false, true)).toEqual(limitedLiability(assets, 200, false, false));
  });

  it('법인격 유지·부인에 따라 개인 재산으로 번지는 손실을 구분한다', () => {
    expect(limitedLiability(195, 200, true, false)).toMatchObject({
      personalBurden: 0,
      creditorLoss: 5,
      personalLossNote: '회사 밖으로 번지지 않는다',
    });
    expect(limitedLiability(195, 200, true, true)).toMatchObject({
      personalBurden: 5,
      creditorLoss: 0,
      personalLossNote: '벽이 뚫렸다',
    });
  });

  it('채권 회수와 손실을 보존하고 개인 재산 한도에서 멈춘다', () => {
    for (const isCorp of [true, false]) {
      for (const pierced of [true, false]) {
        for (const assets of [0, 60, 195, 200, 205]) {
          const r = limitedLiability(assets, 200, isCorp, pierced);
          expect(r.creditorRecovered + r.creditorLoss).toBe(200);
          expect(r.personalBurden).toBeLessThanOrEqual(PERSONAL);
          expect(r.personalBurden).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });
});
