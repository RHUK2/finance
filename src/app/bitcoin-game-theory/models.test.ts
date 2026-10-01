import { describe, expect, it } from 'vitest';

import { BTC_PRICE_BASELINE } from '@/lib/market-baselines';

import {
  attack51,
  bestResponses,
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
// 기본값은 docs/fact-check-log.md 「시간이 지나면 다시 봐야 하는 값」: $75,000, 810 EH/s, $0.025/kWh.
describe('attack51 회수 기간', () => {
  const base = { btcPrice: 75_000, networkHashrate: 810, attackHours: 6, hardwareCostPerTH: 15, electricity: 0.025 };

  it('기준 시세는 $75,000이다', () => {
    expect(BTC_PRICE_BASELINE.value).toBe(base.btcPrice);
  });

  it('기본값: 매출 61.6억 달러 − 전기 35.5억 달러, 장비 121.5억 달러 → 약 4.65년', () => {
    const a = attack51(base);
    expect(a.honestRevenue).toBeCloseTo(6_159_375_000, 0);
    expect(a.honestPowerCost).toBeCloseTo(3_547_800_000, 0);
    expect(a.honestNet).toBeCloseTo(2_611_575_000, 0);
    expect(a.hardwareCost).toBe(12_150_000_000);
    expect(a.paybackYears).toBeCloseTo(4.65, 2);
    expect(a.paybackYears).toBeLessThan(HARDWARE_LIFE_YEARS);
  });

  it.each([
    [0.02, 3.66],
    [0.03, 6.39],
  ])('전기 $%d/kWh → %d년', (electricity, years) => {
    expect(attack51({ ...base, electricity }).paybackYears).toBeCloseTo(years, 2);
  });

  it('전기 $0.05/kWh면 연 전기비가 매출을 넘어 회수 불가', () => {
    const a = attack51({ ...base, electricity: 0.05 });
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
