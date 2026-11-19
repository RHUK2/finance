import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BTC_PRICE_BASELINE } from '@/lib/market-baselines';

import {
  attack51,
  bestResponses,
  buildCascadeAgents,
  buildHolders,
  CASCADE_CONFIG,
  COLLAPSE_SELL_SHARE,
  SURVIVE_SELL_SHARE,
  cascadeTrajectory,
  HODL_CONFIG,
  hodlTrajectory,
  MAX_ROUNDS,
  type CellKey,
  HARDWARE_LIFE_YEARS,
  payoffMatrix,
  type PayoffCells,
  prisonersDilemma,
} from './models';

const nash = (cells: PayoffCells): CellKey[] => {
  const { meBest, themBest } = bestResponses(cells);
  return (['AA', 'AW', 'WA', 'WW'] as CellKey[]).filter((k) => meBest[k] && themBest[k]);
};

// 티켓 30: 균형은 칸마다 최적대응에서 파생한다. 보수가 같으면 여러 칸이 동시에 균형이다.
describe('보수 행렬의 내시 균형', () => {
  it('채택 우월이면 AA 한 칸', () => {
    const m = payoffMatrix({ u: 6, r: 2, f: 4 });
    expect(m.dominantStrategy).toBe('A');
    expect(nash(m.cells)).toEqual(['AA']);
  });

  it('마진 0(u6 r10 f4)이면 네 칸 모두 균형이고 우월전략이 없다', () => {
    const m = payoffMatrix({ u: 6, r: 10, f: 4 });
    expect(m.margin).toBe(0);
    expect(m.dominantStrategy).toBeNull();
    expect(nash(m.cells)).toEqual(['AA', 'AW', 'WA', 'WW']);
  });

  it('관망 우월(u0 r10 f0)이면 WW 한 칸', () => {
    const m = payoffMatrix({ u: 0, r: 10, f: 0 });
    expect(m.dominantStrategy).toBe('W');
    expect(nash(m.cells)).toEqual(['WW']);
  });

  it('채택 우월이지만 u − r < 0(u0 r4 f6)이면 AA가 균형인데 보수가 음수다', () => {
    const m = payoffMatrix({ u: 0, r: 4, f: 6 });
    expect(nash(m.cells)).toEqual(['AA']);
    expect(m.cells.AA).toEqual([-4, -4]);
  });

  it('죄수의 딜레마는 WW 한 칸', () => {
    expect(nash(prisonersDilemma().cells)).toEqual(['WW']);
  });
});

// 티켓 29: 정직 채굴 회수 기간은 전기비를 뺀 순현금흐름으로 잰다.
// 기본값은 docs/fact-check-log.md 「시간이 지나면 다시 봐야 하는 값」: $75,000, 910 EH/s, $0.025/kWh. 효율은 15 J/TH.
describe('attack51 회수 기간', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-01T00:00:00.000Z'));
  });
  afterEach(() => vi.useRealTimers());

  const base = { btcPrice: 75_000, networkHashrate: 910, attackHours: 6, hardwareCostPerTH: 15, electricity: 0.025 };

  it('기준 시세는 $75,000이다', () => {
    expect(BTC_PRICE_BASELINE.value).toBe(base.btcPrice);
  });

  it('기본값: 매출 61.6억 달러 − 전기 29.9억 달러, 장비 136.5억 달러 → 약 4.31년', () => {
    const a = attack51(base);
    expect(a.honestRevenue).toBeCloseTo(6_159_375_000, 0);
    expect(a.honestPowerCost).toBeCloseTo(2_989_350_000, 0);
    expect(a.honestNet).toBeCloseTo(3_170_025_000, 0);
    expect(a.hardwareCost).toBe(13_650_000_000);
    expect(a.paybackYears).toBeCloseTo(4.31, 2);
    expect(a.paybackYears).toBeLessThan(HARDWARE_LIFE_YEARS);
  });

  it.each([
    [0.02, 3.62],
    [0.03, 5.31],
  ])('전기 $%d/kWh → %d년', (electricity, years) => {
    expect(attack51({ ...base, electricity }).paybackYears).toBeCloseTo(years, 2);
  });

  it('전기 $0.055/kWh면 연 전기비가 매출을 넘어 회수 불가(손익분기 약 $0.0515)', () => {
    const a = attack51({ ...base, electricity: 0.055 });
    expect(a.honestNet).toBeLessThan(0);
    expect(a.paybackYears).toBe(Infinity);
  });

  it('전기 요금을 올리면 회수 기간이 짧아지지 않는다', () => {
    let prev = 0;
    for (let e = 0.005; e <= 0.15; e += 0.005) {
      const years = attack51({ ...base, electricity: e }).paybackYears;
      expect(years).toBeGreaterThanOrEqual(prev);
      prev = years;
    }
  });
});

// 정렬 축을 따라 상태가 바뀐 칸은 항상 왼쪽부터 연속해야 한다.
function expectPrefix(values: boolean[]) {
  const count = values.filter(Boolean).length;
  expect(values).toEqual(values.map((_, i) => i < count));
}

describe('채택 캐스케이드 궤적', () => {
  const c = CASCADE_CONFIG;

  it('화면 기본 임계값과 시드 인원에서 전원이 채택한다', () => {
    const agents = buildCascadeAgents(c.n, c.defaultThreshold, c.seed);
    expect(agents).toEqual(buildCascadeAgents(c.n, c.defaultThreshold, c.seed));
    const frames = cascadeTrajectory(agents, c.defaultSeedCount);
    expect(frames[0].adopted.filter(Boolean)).toHaveLength(c.defaultSeedCount);
    expect(frames.at(-1)!.adopted.filter(Boolean)).toHaveLength(c.n);
  });

  it('슬라이더 전 구간에서 정렬·접두 구간·단조 채택과 수렴을 지킨다', () => {
    const steps = Math.round((c.maxThreshold - c.minThreshold) / c.thresholdStep);
    for (let step = 0; step <= steps; step++) {
      const mean = c.minThreshold + step * c.thresholdStep;
      const agents = buildCascadeAgents(c.n, mean, c.seed);
      expect(agents).toHaveLength(c.n);
      expect(agents.map((a) => a.threshold)).toEqual(agents.map((a) => a.threshold).sort((a, b) => a - b));
      for (let seed = c.minSeedCount; seed <= c.maxSeedCount; seed += c.seedCountStep) {
        const frames = cascadeTrajectory(agents, seed);
        expect(frames.length).toBeLessThan(MAX_ROUNDS);
        frames.forEach((frame, r) => {
          expectPrefix(frame.adopted);
          expect(frame.p).toBe(frame.adopted.filter(Boolean).length / agents.length);
          if (r === 0) return;
          const prev = frames[r - 1];
          expect(frame.p).toBeGreaterThan(prev.p);
          expect(frame.justChanged).toEqual(frame.adopted.map((a, i) => a && !prev.adopted[i]));
        });
        const last = frames.at(-1)!;
        expect(agents.every((a, i) => last.adopted[i] || a.threshold > last.p)).toBe(true);
      }
    }
  });
});

describe('홀더 궤적', () => {
  it('충격 흡수와 붕괴의 매도 비중 임계값은 10%와 50%다', () => {
    // 상수를 읽는 다른 테스트는 임계값 변경을 잡지 못하므로 값을 고정한다.
    expect(SURVIVE_SELL_SHARE).toBe(0.1);
    expect(COLLAPSE_SELL_SHARE).toBe(0.5);
  });

  it('슬라이더 전 구간에서 정렬·접두 매도·가격 하락·차트 하한과 수렴을 지킨다', () => {
    const c = HODL_CONFIG;
    const steps = Math.round((c.maxConviction - c.minConviction) / c.convictionStep);
    for (let step = 0; step <= steps; step++) {
      const mean = c.minConviction + step * c.convictionStep;
      const holders = buildHolders(c.n, mean, c.seed);
      expect(holders).toHaveLength(c.n);
      expect(holders).toEqual(buildHolders(c.n, mean, c.seed));
      expect(holders.map((h) => h.conviction)).toEqual(holders.map((h) => h.conviction).sort((a, b) => a - b));
      const frames = hodlTrajectory(holders, c.shock);
      expect(frames.length).toBeLessThan(MAX_ROUNDS);
      expect(frames[0].state.price).toBe(100);
      expect(frames[0].state.sold.some(Boolean)).toBe(false);
      frames.forEach(({ state, justChanged }, r) => {
        expectPrefix(state.sold);
        expect(state.price).toBeGreaterThan(c.priceFloor);
        expect(state.drawdown).toBeCloseTo(1 - state.price / 100);
        if (r === 0) return;
        const prev = frames[r - 1].state;
        expect(state.price).toBeLessThanOrEqual(prev.price);
        expect(prev.sold.every((sold, i) => !sold || state.sold[i])).toBe(true);
        expect(justChanged).toEqual(state.sold.map((sold, i) => sold && !prev.sold[i]));
        expect(state.newSellers).toBe(justChanged.filter(Boolean).length);
      });
      const last = frames.at(-1)!.state;
      expect(holders.every((h, i) => last.sold[i] || h.conviction > last.drawdown)).toBe(true);
    }
  });

  it('일부만 매도하고 멈추는 가운데 결과가 연속된 확신도 구간에 존재한다', () => {
    const c = HODL_CONFIG;
    const steps = Math.round((c.maxConviction - c.minConviction) / c.convictionStep);
    const partialSteps: number[] = [];
    for (let step = 0; step <= steps; step++) {
      const mean = c.minConviction + step * c.convictionStep;
      const holders = buildHolders(c.n, mean, c.seed);
      const last = hodlTrajectory(holders, c.shock).at(-1)!.state;
      const soldCount = last.sold.filter(Boolean).length;
      // 화면의 가운데 결과: 붕괴(50% 초과)도 충격 흡수(10% 이하)도 아니다.
      if (soldCount > c.n * SURVIVE_SELL_SHARE && soldCount <= c.n * COLLAPSE_SELL_SHARE) partialSteps.push(step);
    }
    expect(partialSteps.some((step, i) => i > 0 && step === partialSteps[i - 1] + 1)).toBe(true);
  });

  it('충격이나 추가 매도 없이 멈추며, 충격만 있는 라운드는 보존한다', () => {
    const holders = [{ conviction: 0.9, band: '다이아몬드손' as const }];
    expect(hodlTrajectory(holders, 0)).toHaveLength(1);
    const frames = hodlTrajectory(holders, HODL_CONFIG.shock);
    expect(frames).toHaveLength(2);
    expect(frames[1].state.price).toBe(85);
    expect(frames[1].state.newSellers).toBe(0);
  });

  // M-136: 매도자 10% 이하라도 추가 매도로 가격이 첫 충격선 아래로 내려간다.
  it('소수 매도에 그친 고정 시드에서도 첫 충격선보다 더 하락할 수 있다', () => {
    const c = HODL_CONFIG;
    const holders = buildHolders(c.n, 0.55, c.seed);
    const frames = hodlTrajectory(holders, c.shock);
    const last = frames.at(-1)!.state;
    const soldCount = last.sold.filter(Boolean).length;
    expect(soldCount).toBeGreaterThan(0);
    expect(soldCount).toBeLessThanOrEqual(c.n * SURVIVE_SELL_SHARE);
    expect(last.price).toBeLessThan(100 * (1 - c.shock));
    // 0번은 초기 상태, 1번은 외생 충격 라운드다. 2번부터 후속 라운드의 추가 매도를 확인한다.
    expect(frames.slice(2).some(({ state }) => state.newSellers > 0)).toBe(true);
  });
});
