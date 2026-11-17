import { describe, expect, it } from 'vitest';

import {
  daysSinceGenesis,
  dailyIssuanceBtc,
  subsidyAtDate,
  subsidyAtEra,
  powerLawPrice,
  generateModelDates,
  mayerMultiple,
  puellMultiple,
  piCycleCrossovers,
  BLOCKS_PER_DAY,
  BLOCKS_PER_HALVING,
  HALVINGS,
  INITIAL_SUBSIDY_BTC,
  MAX_SUPPLY_BTC,
  movingAverage,
  mvrvZScore,
  rollingVolatility,
  type SeriesPoint,
} from './bitcoin-models';

const series = (values: number[]): SeriesPoint[] =>
  values.map((value, i) => ({ time: `t${String(i).padStart(4, '0')}`, value }));

describe('프로토콜 상수', () => {
  it('보조금 50 BTC, 반감기 210,000블록, 하루 144블록, 최대 공급 2,100만', () => {
    expect(INITIAL_SUBSIDY_BTC).toBe(50);
    expect(BLOCKS_PER_HALVING).toBe(210_000);
    expect(BLOCKS_PER_DAY).toBe(144);
    expect(MAX_SUPPLY_BTC).toBe(21_000_000);
  });

  it('반감기 표는 보상이 매번 절반이 된다', () => {
    for (let i = 1; i < HALVINGS.length; i++) expect(HALVINGS[i].reward).toBe(HALVINGS[i - 1].reward / 2);
    expect(HALVINGS.filter((h) => !h.estimated).map((h) => h.date.slice(0, 4))).toEqual([
      '2009',
      '2012',
      '2016',
      '2020',
      '2024',
    ]);
  });
});

describe('movingAverage', () => {
  it('1..5의 3일 평균은 2·3·4이고 끝 날짜에 붙는다', () => {
    expect(movingAverage(series([1, 2, 3, 4, 5]), 3)).toEqual([
      { time: 't0002', value: 2 },
      { time: 't0003', value: 3 },
      { time: 't0004', value: 4 },
    ]);
  });

  it('창이 0이거나 표본보다 길면 비어 있다', () => {
    expect(movingAverage(series([1, 2]), 0)).toEqual([]);
    expect(movingAverage(series([1, 2]), 3)).toEqual([]);
  });
});

describe('rollingVolatility', () => {
  it('일간 로그수익률 +1·−1의 2일 창은 표준편차 1 → √365 × 100', () => {
    const out = rollingVolatility(series([1, Math.E, 1]), 2);
    expect(out).toHaveLength(1);
    expect(out[0].time).toBe('t0002');
    expect(out[0].value).toBeCloseTo(Math.sqrt(365) * 100, 9);
  });

  it('일정한 비율로 오르면 변동성은 0이다', () => {
    const out = rollingVolatility(series([100, 110, 121, 133.1, 146.41]), 3);
    expect(out).toHaveLength(2);
    for (const p of out) expect(p.value).toBeCloseTo(0, 9);
  });
});

describe('mvrvZScore', () => {
  // 시총 1·2·3·4·5를 73번씩(365일) 늘어놓으면 평균 3, 모표준편차 √2다.
  const rows = Array.from({ length: 365 }, (_, i) => ({ time: `d${i}`, marketCap: (i % 5) + 1, mvrv: 2 }));

  it('1년 표본이 쌓인 날부터 (시총 − 실현시총) ÷ 표준편차', () => {
    const out = mvrvZScore(rows);
    expect(out).toHaveLength(1);
    expect(out[0].time).toBe('d364');
    // 마지막 날 시총 5, MVRV 2 → 실현시총 2.5
    expect(out[0].value).toBeCloseTo(2.5 / Math.sqrt(2), 9);
  });

  it('365일 미만이거나 시총이 일정하면(표준편차 0) 내지 않는다', () => {
    expect(mvrvZScore(rows.slice(0, 364))).toEqual([]);
    expect(mvrvZScore(rows.map((r) => ({ ...r, marketCap: 7 })))).toEqual([]);
  });

  it('시총·MVRV가 0 이하인 행은 표본에서 뺀다', () => {
    const withBad = [{ time: 'bad', marketCap: 0, mvrv: 2 }, ...rows, { time: 'bad2', marketCap: 5, mvrv: 0 }];
    expect(mvrvZScore(withBad)).toEqual(mvrvZScore(rows));
  });
});

describe('가격 모델과 날짜 경계', () => {
  it('제네시스 이전·당일은 1일, 이후는 UTC 날짜 차이다', () => {
    for (const date of ['2009-01-02', '2009-01-03', '2009-01-04']) expect(daysSinceGenesis(date)).toBe(1);
    expect(daysSinceGenesis('2009-01-05')).toBe(2);
    expect(powerLawPrice(0)).toBe(0);
  });
  it.each([
    ['2012-11-28', 12.8],
    ['2015-07-15', 277],
    ['2018-12-15', 3426],
  ] as const)('보정점 %s는 기록된 근삿값을 재현한다', (date, price) => {
    expect(powerLawPrice(daysSinceGenesis(date))).toBeCloseTo(price, price < 100 ? 1 : 0);
  });
  it('각 반감기 당일부터 새 보상으로 발행한다', () => {
    HALVINGS.slice(1).forEach((era, i) => {
      const before = new Date(Date.parse(era.date) - 86_400_000).toISOString().slice(0, 10);
      expect(dailyIssuanceBtc(before)).toBe(HALVINGS[i].reward * 144);
      expect(dailyIssuanceBtc(era.date)).toBe(era.reward * 144);
    });
  });
  it('시작과 간격에 맞는 끝을 포함하고 끝을 넘지 않는다', () => {
    expect(generateModelDates('2024-02-28', '2024-03-01', 1)).toEqual(['2024-02-28', '2024-02-29', '2024-03-01']);
    expect(generateModelDates('2024-01-01', '2024-01-09')).toEqual(['2024-01-01', '2024-01-08']);
    expect(generateModelDates('2024-01-02', '2024-01-01')).toEqual([]);
  });
});

describe('차트 지표', () => {
  it('메이어는 200번째 관측부터 현재 가격을 당일 포함 평균으로 나눈다', () => {
    const history = series([...Array<number>(199).fill(100), 200]);
    expect(mayerMultiple(history.slice(0, 199))).toEqual([]);
    expect(mayerMultiple(history)).toEqual([{ time: 't0199', value: 200 / 100.5 }]);
    expect(mayerMultiple(series(Array<number>(200).fill(0)))).toEqual([]);
  });
  it('푸엘은 반감기 당일 줄어든 발행액과 365일 평균을 비교한다', () => {
    const history = generateModelDates('2023-04-22', '2024-04-20', 1).map((time) => ({ time, value: 100 }));
    expect(puellMultiple(history.slice(0, 364))).toEqual([]);
    expect(puellMultiple(history)).toEqual([{ time: '2024-04-20', value: 45000 / ((364 * 90000 + 45000) / 365) }]);
  });
  it('파이 사이클은 첫 비교점이 이미 위여도 신호를 내지 않는다', () => {
    const history = series([...Array<number>(239).fill(1), ...Array<number>(111).fill(100)]);
    expect(piCycleCrossovers(history).crossovers).toEqual([]);
    expect(piCycleCrossovers(history.slice(0, 349)).sma350x2).toEqual([]);
  });
  it('파이 사이클은 아래에서 같아지는 날만 세고 위에 머무는 날은 중복하지 않는다', () => {
    // 128이 이어지다가 38,978이 되면 두 선이 정확히 478로 같아진다.
    const history = series([...Array<number>(350).fill(128), 38978, 38978]);
    const result = piCycleCrossovers(history);
    expect(result.sma111.find((p) => p.time === 't0350')?.value).toBe(478);
    expect(result.sma350x2.find((p) => p.time === 't0350')?.value).toBe(478);
    expect(result.crossovers).toEqual([{ time: 't0350' }]);
    expect(piCycleCrossovers(series(Array<number>(400).fill(100))).crossovers).toEqual([]);
  });
});

describe('비정상 가격의 실현 변동성', () => {
  it.each([0, -1, NaN, Infinity, -Infinity])('가격 %s의 양옆 수익률을 제외한다', (bad) => {
    const out = rollingVolatility(series([1, Math.E, bad, 1, Math.E]), 2);
    expect(out).toHaveLength(1);
    expect(out[0].time).toBe('t0004');
    expect(out[0].value).toBeCloseTo(0, 9);
  });
  it('유한 양수의 비율이 overflow해도 로그 차이는 유한하다', () => {
    const out = rollingVolatility(series([Number.MIN_VALUE, Number.MAX_VALUE, Number.MIN_VALUE]), 2);
    expect(Number.isFinite(out[0].value)).toBe(true);
  });
});

describe('공용 보조금 전환', () => {
  it.each([
    ['2024-04-19', 3, 6.25],
    ['2024-04-19T23:59:59.999Z', 3, 6.25],
    ['2024-04-20', 4, 3.125],
    ['2026-11-17', 4, 3.125],
    ['2028-04-12', 4, 3.125],
    ['2028-04-13', 5, 1.5625],
  ])('%s의 시대와 보조금을 같은 UTC 경계로 전환한다', (date, era, subsidy) => {
    expect(subsidyAtDate(date)).toEqual({ era, subsidy });
    expect(dailyIssuanceBtc(date)).toBe(subsidy * 144);
  });

  it('사토시 내림과 제네시스 이전 기본값을 유지한다', () => {
    expect([31, 32, 33].map(subsidyAtEra)).toEqual([2e-8, 1e-8, 0]);
    expect(subsidyAtEra(-1)).toBe(50);
    expect(subsidyAtDate('2008-01-01')).toEqual({ era: 0, subsidy: 50 });
  });
});
