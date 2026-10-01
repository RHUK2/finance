import { describe, expect, it } from 'vitest';

import { crackResult, type CrackHedge, FUTURES_PRICE, hedgeLedger, PRODUCER_BARRELS, REFINER_BARRELS } from './models';

// 티켓 26: 헤지 장부 배너는 잠근 선물가(effectiveFutures)를 기준으로 갈라야 모델과 맞는다.
describe('hedgeLedger', () => {
  const grid = () => {
    const out: { hedge: number; settle: number; spec: number }[] = [];
    for (let h = 0; h <= 20; h++)
      for (let settle = 40; settle <= 120; settle += 4)
        for (let s = 0; s <= 19; s++) out.push({ hedge: h * 0.05, settle, spec: s * 0.05 });
    return out;
  };

  it('물량이 보존된다: 넘기려 한 물량 = 정유사 + 투기자 + 미체결', () => {
    for (const { hedge, settle, spec } of grid()) {
      const l = hedgeLedger(hedge, settle, spec);
      expect(l.matched + l.toSpeculators + l.unfilled).toBeCloseTo(l.wanted, 6);
      expect(l.matched).toBeLessThanOrEqual(REFINER_BARRELS);
    }
  });

  it('선물은 제로섬이다: 산유국 손익 = −(정유사 손익 + 투기자 손익)', () => {
    for (const { hedge, settle, spec } of grid()) {
      const l = hedgeLedger(hedge, settle, spec);
      const refinerPnl = (settle - l.refinerEffective) * REFINER_BARRELS;
      expect(l.producerFutures + refinerPnl + l.speculatorPnl).toBeCloseTo(0, 3);
    }
  });

  it('헤지가 무헤지보다 나은지는 만기가가 잠근 선물가보다 낮은지로 갈린다', () => {
    for (const { hedge, settle, spec } of grid()) {
      const l = hedgeLedger(hedge, settle, spec);
      const gain = l.producerEffective - l.producerNaked;
      const hedged = l.matched + l.toSpeculators;
      if (hedged === 0 || settle === l.effectiveFutures) expect(gain).toBeCloseTo(0, 9);
      else expect(Math.sign(gain)).toBe(Math.sign(l.effectiveFutures - settle));
    }
  });

  it('기본값(헤지 100%, 투기자 60%): 만기 78이면 계약가 78보다 높은 $79.22를 받는다', () => {
    const l = hedgeLedger(1, 78, 0.6);
    expect(l.effectiveFutures).toBeCloseTo(79.296, 3);
    expect(l.producerEffective).toBeCloseTo(79.22, 2);
    expect(l.producerEffective).toBeGreaterThan(FUTURES_PRICE);
  });

  it('헤지 0%면 무헤지와 같고 체결률은 100%로 둔다', () => {
    const l = hedgeLedger(0, 60, 0.6);
    expect(l.producerEffective).toBe(60);
    expect(l.fillRate).toBe(1);
  });

  it('투기자 0%: 정유사 60만 배럴만 체결되고 40만 배럴이 남는다', () => {
    const l = hedgeLedger(1, 70, 0);
    expect([l.matched, l.toSpeculators, l.unfilled]).toEqual([REFINER_BARRELS, 0, PRODUCER_BARRELS - REFINER_BARRELS]);
    expect(l.fillRate).toBeCloseTo(0.6, 12);
    expect(hedgeLedger(0.6, 70, 0).fillRate).toBe(1);
  });
});

// 티켓 27: 세 막대가 한 축을 쓰려면 최대값이 세 선택지의 마진 전부에서 나와야 한다.
describe('crackResult', () => {
  const HEDGES: CrackHedge[] = ['none', 'crude', 'both'];

  it('원유 120·휘발유 150: 세 선택지의 마진은 30·72·17이다', () => {
    expect(HEDGES.map((h) => crackResult(120, 150, h).margin)).toEqual([30, 72, 17]);
  });

  it('crackNow·locked는 고른 방식과 무관하다', () => {
    for (const h of HEDGES) {
      expect(crackResult(120, 150, h).crackNow).toBe(30);
      expect(crackResult(120, 150, h).locked).toBe(17);
    }
  });

  it('양쪽을 다 잠그면 가격이 어디로 가도 마진이 같다', () => {
    for (let c = 60; c <= 120; c += 10)
      for (let g = 70; g <= 150; g += 10) expect(crackResult(c, g, 'both').margin).toBe(17);
  });

  it('원유만 잠그면 원유 가격에 노출되지 않는다', () => {
    expect(crackResult(60, 100, 'crude').margin).toBe(crackResult(120, 100, 'crude').margin);
    expect(crackResult(60, 100, 'crude').exposedTo).toBe('gasoline');
  });
});
