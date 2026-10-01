import { describe, expect, it } from 'vitest';

import {
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
