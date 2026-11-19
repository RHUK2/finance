import { describe, expect, it } from 'vitest';

import {
  basisCurves,
  buildPositions,
  cascadeTrajectory,
  CASCADE_IMPACT,
  ENTRY_PRICE,
  OPENING_SHOCK,
  crackResult,
  crackMarginBars,
  type CrackHedge,
  fundingCost,
  FUTURES_PRICE,
  hedgeLedger,
  formatBarrels,
  hedgeFillNote,
  PRODUCER_BARRELS,
  REFINER_BARRELS,
} from './models';

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

describe('crackMarginBars', () => {
  it('음수 마진도 절댓값 길이로 보이고 손실 부호를 보존한다', () => {
    const { bars, max } = crackMarginBars(120, 50);
    expect(bars).toEqual([
      { margin: -70, value: 70, loss: true },
      { margin: -28, value: 28, loss: true },
      { margin: 17, value: 17, loss: false },
    ]);
    expect(max).toBe(70);
  });

  it('가장 긴 막대는 세 방식 전체에서 정하고 마진 0의 길이는 0이다', () => {
    expect(crackMarginBars(120, 150).max).toBe(72);
    const { bars, max } = crackMarginBars(78, 78);
    expect(bars.slice(0, 2)).toEqual([
      { margin: 0, value: 0, loss: false },
      { margin: 0, value: 0, loss: false },
    ]);
    expect(max).toBe(17);
  });
});

// 펀딩비는 명목가 × 요율의 단순 합이다. 복리로 쌓으면 슬라이더 끝(롱 90%·90일)에서 명목가의 102%가 빠진다고 나왔다.
describe('fundingCost', () => {
  it('누적 펀딩비 비율은 회당 요율 × 횟수다', () => {
    const f = fundingCost(0.7, 30);
    expect(f.charges).toBe(90);
    expect(f.cumulative).toBeCloseTo(f.perCharge * 90, 12);
  });

  it('슬라이더 끝에서도 명목가를 넘지 않는다', () => {
    const f = fundingCost(0.9, 90);
    expect(f.cumulative).toBeCloseTo(0.0026 * 270, 10);
    expect(f.cumulative).toBeLessThan(1);
  });
});

describe('강제청산 궤적', () => {
  it('같은 시드는 같은 포지션을 만들고 청산 낙폭 순으로 정렬한다', () => {
    for (const mean of [2, 8, 20]) {
      const positions = buildPositions(180, mean, 4242);
      expect(positions).toEqual(buildPositions(180, mean, 4242));
      expect(positions).toHaveLength(180);
      positions.forEach((p, i) => {
        expect(p.multiple).toBeGreaterThanOrEqual(1.5);
        expect(p.multiple).toBeLessThanOrEqual(60);
        expect(p.drawdown).toBeCloseTo(1 / p.multiple, 12);
        expect(p.notional).toBe(p.multiple);
        if (i > 0) expect(p.drawdown).toBeGreaterThanOrEqual(positions[i - 1].drawdown);
      });
    }
  });

  it('슬라이더 전 구간에서 가격은 감소하고 강제청산은 접두 구간을 넓히다가 완전히 멈춘다', () => {
    for (let mean = 2; mean <= 20; mean += 0.5) {
      const positions = buildPositions(180, mean, 4242);
      const frames = cascadeTrajectory(positions, CASCADE_IMPACT);
      expect(frames[0].price).toBe(ENTRY_PRICE * (1 - OPENING_SHOCK));
      expect(frames[0].liquidated.every((v) => !v)).toBe(true);
      expect(frames[0].justChanged.every((v) => !v)).toBe(true);
      frames.forEach((frame, round) => {
        expect(frame.liquidated).toHaveLength(positions.length);
        expect(frame.justChanged).toHaveLength(positions.length);
        const count = frame.liquidated.filter(Boolean).length;
        expect(frame.liquidated).toEqual(positions.map((_, i) => i < count));
        expect(frame.price).toBeGreaterThanOrEqual(ENTRY_PRICE * 0.05);
        expect(frame.drawdown).toBeCloseTo(1 - frame.price / ENTRY_PRICE, 12);
        if (round === 0) return;
        const previous = frames[round - 1];
        expect(frame.price).toBeLessThanOrEqual(previous.price);
        expect(frame.justChanged.some(Boolean)).toBe(true);
        positions.forEach((p, i) => {
          expect(frame.liquidated[i]).toBe(previous.liquidated[i] || p.drawdown <= previous.drawdown);
          expect(frame.justChanged[i]).toBe(frame.liquidated[i] && !previous.liquidated[i]);
        });
      });
      const last = frames.at(-1)!;
      positions.forEach((p, i) => {
        if (!last.liquidated[i]) expect(p.drawdown).toBeGreaterThan(last.drawdown);
      });
    }
  });

  it('180개가 한 라운드에 하나씩 강제청산되어도 안전장치가 궤적을 자르지 않는다', () => {
    const n = 180;
    const factor = 1 - CASCADE_IMPACT / n;
    const initial = ENTRY_PRICE * (1 - OPENING_SHOCK);
    const positions = Array.from({ length: n }, (_, i) => ({
      multiple: 1,
      notional: 1,
      drawdown: i === 0 ? OPENING_SHOCK / 2 : 1 - (initial * (factor ** (i - 1) + factor ** i)) / 2 / ENTRY_PRICE,
    }));
    const frames = cascadeTrajectory(positions, CASCADE_IMPACT);
    expect(frames).toHaveLength(n + 1);
    expect(frames.at(-1)!.liquidated.every(Boolean)).toBe(true);
    for (const frame of frames.slice(1)) expect(frame.justChanged.filter(Boolean)).toHaveLength(1);
  });
});

describe('basisCurves', () => {
  it('기본 길이는 60이며 만기물은 0으로 끝나고 무기한물은 양의 톱니를 유지한다', () => {
    for (const share of [0.5, 0.7, 0.9]) {
      const { dated, perpetual } = basisCurves(share);
      expect(dated).toHaveLength(60);
      expect(perpetual).toHaveLength(60);
      expect(dated[0]).toBe(2.4);
      expect(dated.at(-1)).toBe(0);
      expect(perpetual.every((v) => Number.isFinite(v) && v > 0)).toBe(true);
      for (let i = 1; i < dated.length; i++) expect(dated[i]).toBeLessThan(dated[i - 1]);
      expect(perpetual[6]).toBe(perpetual[0]);
      expect(perpetual[5]).toBeGreaterThan(perpetual[6]);
    }
  });

  it('지정한 길이를 따르고 쏠림이 클수록 무기한물의 베이시스가 높다', () => {
    for (const steps of [2, 12, 120]) {
      const low = basisCurves(0.5, steps);
      const high = basisCurves(0.9, steps);
      expect(high.dated).toHaveLength(steps);
      expect(high.perpetual).toHaveLength(steps);
      expect(high.dated.at(-1)).toBe(0);
      expect(high.dated).toEqual(low.dated);
      high.perpetual.forEach((v, i) => expect(v).toBeGreaterThan(low.perpetual[i]));
    }
  });
});

describe('헤지 물량 표기 경계', () => {
  it.each([
    [0, '0.00M 배럴'],
    [7400, '7,400 배럴'],
    [9999, '9,999 배럴'],
    [9999.6, '10,000 배럴'],
    [10000, '0.01M 배럴'],
    [600000, '0.60M 배럴'],
  ])('%s 배럴의 정밀도를 유지한다', (barrels, text) => {
    expect(formatBarrels(barrels)).toBe(text);
  });
  it('체결 완료와 양수 미체결을 구분한다', () => {
    expect(hedgeFillNote(0)).toBe('넘기려 한 물량이 모두 체결됨');
    const l = hedgeLedger(0.65, 60, 0.6);
    expect(l.unfilled).toBeGreaterThan(0);
    expect(l.unfilled).toBeLessThan(10000);
    expect(hedgeFillNote(l.unfilled)).toBe('7,330 배럴이 상대를 못 찾음');
  });
});
