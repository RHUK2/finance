import { describe, expect, it, vi } from 'vitest';

import { subsidyAtEra } from '@/lib/bitcoin-models';

import { formatBtc } from './format';

// 현재 시대는 모듈 초기화 때 정해지므로 import 전에 기준 날짜를 고정한다.
vi.useFakeTimers();
vi.setSystemTime(new Date('2026-08-01T00:00:00.000Z'));
const {
  BASE,
  BASE_ANNUAL,
  attackCost,
  blockRevenue,
  requiredFee,
  BLOCKS_PER_YEAR,
  CURRENT_ERA,
  cumulativeSupply,
  eraStartYear,
  LAST_SUBSIDY_ERA,
} = await import('./models');
vi.useRealTimers();

describe('BTC 표기', () => {
  it.each([
    [0.99994, '0.9999 BTC'],
    [0.99996, '1 BTC'],
    [1, '1 BTC'],
    [1.00001, '1.00001 BTC'],
  ])('%s BTC를 %s로 표시한다', (value, label) => {
    expect(formatBtc(value)).toBe(label);
  });
});

// 발행 스케줄은 프로토콜이 정한다. 사토시 정수 나눗셈이라 50 BTC = 5e9 sat을 33번 자르면 0이다.
describe('보조금', () => {
  it('시대 4는 3.125 BTC', () => {
    expect(subsidyAtEra(0)).toBe(50);
    expect(subsidyAtEra(4)).toBe(3.125);
  });

  // 티켓 25: 마지막 1사토시는 시대 32, 0이 되는 것은 시대 33이다.
  it('시대 31·32·33은 2 sat·1 sat·0', () => {
    expect(LAST_SUBSIDY_ERA).toBe(32);
    expect(Math.round(subsidyAtEra(31) * 1e8)).toBe(2);
    expect(Math.round(subsidyAtEra(32) * 1e8)).toBe(1);
    expect(subsidyAtEra(33)).toBe(0);
    expect(subsidyAtEra(LAST_SUBSIDY_ERA + 1)).toBe(0);
  });

  it('누적 공급은 20,999,999.9769 BTC에서 멈추고 2,100만을 넘지 않는다', () => {
    expect(cumulativeSupply(33)).toBeCloseTo(20_999_999.9769, 4);
    expect(cumulativeSupply(40)).toBe(cumulativeSupply(33));
    expect(cumulativeSupply(33)).toBeLessThan(21_000_000);
  });
});

describe('시대 시작 연도', () => {
  it('지난 반감기는 실측 연도다', () => {
    expect([0, 1, 2, 3, 4].map(eraStartYear)).toEqual([2009, 2012, 2016, 2020, 2024]);
    expect(CURRENT_ERA).toBe(4);
  });

  it('앞으로의 시대는 약 4년씩, 보조금이 0이 되는 해는 2140년 언저리', () => {
    expect([5, 6].map(eraStartYear)).toEqual([2028, 2032]);
    expect([31, 32, 33].map(eraStartYear)).toEqual([2132, 2136, 2140]);
  });

  it('1년 = 144블록 × 365일', () => {
    expect(BLOCKS_PER_YEAR).toBe(52_560);
  });
});

describe('보안 예산과 공격 비용', () => {
  it.each([
    ['2028-04-12T23:59:59.999Z', 4],
    ['2028-04-13T00:00:00.000Z', 5],
  ] as const)('%s에도 과거 시장 기준점의 연간 예산은 유지된다', async (date, currentEra) => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date(date));
      vi.resetModules();
      const models = await import('./models');

      expect(models.CURRENT_ERA).toBe(currentEra);
      expect(models.BASE.era).toBe(4);
      expect(models.BASE_ANNUAL).toBe(12_397_590_000);
    } finally {
      vi.useRealTimers();
      vi.resetModules();
    }
  });

  it('블록 수입을 달러·연간 예산으로 환산하고 수수료 몫을 구한다', () => {
    expect(blockRevenue({ era: 4, btcPrice: 100_000, feePerBlock: 0.125 })).toEqual({
      subsidy: 3.125,
      totalBtc: 3.25,
      perBlockUsd: 325_000,
      annualUsd: 17_082_000_000,
      feeShare: 0.125 / 3.25,
    });
    expect(BASE_ANNUAL).toBe((subsidyAtEra(BASE.era) + BASE.feePerBlock) * BASE.btcPrice * 52_560);
  });

  it.each([CURRENT_ERA, CURRENT_ERA + 1, LAST_SUBSIDY_ERA + 1])(
    '시대 %s에서 필요한 수수료는 목표 예산을 복원한다',
    (era) => {
      for (const btcPrice of [BASE.btcPrice / 2, BASE.btcPrice]) {
        const feePerBlock = requiredFee(BASE_ANNUAL, era, btcPrice);
        expect(blockRevenue({ era, btcPrice, feePerBlock }).annualUsd / BASE_ANNUAL).toBeCloseTo(1, 12);
      }
    },
  );

  it('보조금만으로 목표를 넘으면 필요 수수료는 0이다', () => {
    expect(requiredFee(BASE_ANNUAL, BASE.era, BASE.btcPrice * 2)).toBe(0);
    expect(requiredFee(0, BASE.era, BASE.btcPrice)).toBe(0);
  });

  it('보조금이 끝나면 수수료가 전부이며, 수입 0도 유한한 값이다', () => {
    for (const feePerBlock of [0, 0.02]) {
      const revenue = blockRevenue({ ...BASE, era: LAST_SUBSIDY_ERA + 1, feePerBlock });
      expect(revenue.subsidy).toBe(0);
      expect(revenue.feeShare).toBe(1);
      expect(revenue.annualUsd).toBe(feePerBlock * BASE.btcPrice * BLOCKS_PER_YEAR);
    }
  });

  it('공격 운영비는 예산과 시간에 비례하고 8760시간이면 연간 예산과 같다', () => {
    expect(attackCost(BASE_ANNUAL, 8760)).toBeCloseTo(BASE_ANNUAL, 4);
    expect(attackCost(8760, 1)).toBe(1);
    expect(attackCost(8760, 24)).toBe(24);
    expect(attackCost(BASE_ANNUAL, 0)).toBe(0);
    expect(attackCost(0, 24)).toBe(0);
  });
});
