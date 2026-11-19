import { afterEach, expect, it, vi } from 'vitest';

import { subsidyAtEra } from '@/lib/bitcoin-models';
import { fetchFredSeries } from '@/lib/fred';

import { loadFearGreed } from './fear-greed';
import { loadHashrateHistory } from './hashrate-history';
import { loadInflationDataKr } from './inflation-data-kr';
import { loadMempoolBlocks } from './mempool-blocks';
import { loadMempoolStats } from './mempool-stats';
import { loadMiningPools } from './mining-pools';
import { loadMiningStats } from './mining-stats';
import { loadMvrv } from './mvrv';
import { loadRecentBlocks } from './recent-blocks';

vi.mock('@/lib/cache', () => ({ cached: (_key: string, fetcher: () => Promise<unknown>) => fetcher() }));
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
const respond = (...values: unknown[]) => {
  let index = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => values[index++] })),
  );
};

it('빈 해시레이트 이력을 거부하고 정상 이력은 EH/s로 반환한다', async () => {
  respond({ hashrates: [] });
  await expect(loadHashrateHistory()).rejects.toThrow('빈 시계열');
  respond({ hashrates: [{ timestamp: 1704067200, avgHashrate: 500e18 }] });
  expect((await loadHashrateHistory()).history).toEqual([{ time: '2024-01-01', value: 500 }]);
});

it.each([undefined, null, NaN, Infinity, 0, -1])('잘못된 해시레이트 이력 값 %s를 거부한다', async (avgHashrate) => {
  respond({
    hashrates: [
      { timestamp: 1704067200, avgHashrate: 500e18 },
      { timestamp: 1704153600, avgHashrate },
    ],
  });
  await expect(loadHashrateHistory()).rejects.toThrow('잘못된 해시레이트');
});

it('공포지수를 정렬·중복 제거하고 최신 관측의 분류를 쓴다', async () => {
  const row = (timestamp: string, value: string, classification = 'Fear') => ({
    timestamp,
    value,
    value_classification: classification,
  });
  respond({
    data: [row('1704067200', '20'), row('1704153600', '70', 'Greed'), row('1704153601', '71')],
  });
  expect(await loadFearGreed()).toMatchObject({
    value: 70,
    classification: 'Greed',
    history: [
      { time: '2024-01-01', value: 20 },
      { time: '2024-01-02', value: 70 },
    ],
  });
  respond({ data: [row('1704067200', 'bad')] });
  await expect(loadFearGreed()).rejects.toThrow('빈 시계열');
});

it.each([null, 50, '', '   ', 'NaN', 'Infinity', 'bad', '1e3', '-5', '100.1'])(
  '공포지수의 비숫자 값 %s를 거르고 유효한 최신 관측과 분류를 함께 반환한다',
  async (value) => {
    const valid = { timestamp: '1704153600', value: '0', value_classification: 'Extreme Fear' };
    const broken = { timestamp: '1704067200', value, value_classification: 'Greed' };
    for (const data of [
      [broken, valid],
      [valid, broken],
    ]) {
      respond({ data });
      expect(await loadFearGreed()).toMatchObject({
        value: 0,
        classification: 'Extreme Fear',
        history: [{ time: '2024-01-02', value: 0 }],
      });
    }
    respond({ data: [broken] });
    await expect(loadFearGreed()).rejects.toThrow('빈 시계열');
  },
);

it('공포지수의 같은 날짜에 비숫자 행과 정상 행이 있으면 정상 행을 보존한다', async () => {
  const broken = { timestamp: '1704153600', value: 'bad', value_classification: 'Greed' };
  const valid = { timestamp: '1704153601', value: '30', value_classification: 'Fear' };
  for (const data of [
    [broken, valid],
    [valid, broken],
  ]) {
    respond({ data });
    expect(await loadFearGreed()).toMatchObject({
      value: 30,
      classification: 'Fear',
      history: [{ time: '2024-01-02', value: 30 }],
    });
  }
});

it.each([null, 50, '', '   ', 'NaN', 'Infinity', 'bad', '1e3', '-5', '100.1'])(
  '공포지수의 최신 날짜 값 %s가 비숫자이면 갱신을 거부한다',
  async (value) => {
    const valid = { timestamp: '1704067200', value: '0', value_classification: 'Extreme Fear' };
    const broken = { timestamp: '1704153600', value, value_classification: 'Greed' };
    for (const data of [
      [broken, valid],
      [valid, broken],
    ]) {
      respond({ data });
      await expect(loadFearGreed()).rejects.toThrow('No valid fear & greed data');
    }
  },
);

it.each([
  { timestamp: '' },
  { timestamp: null },
  { timestamp: '0' },
  { timestamp: '-1' },
  { timestamp: 'bad' },
  { timestamp: 'Infinity' },
  { timestamp: '1e20' },
])('공포지수의 잘못된 날짜 %j가 하나라도 있으면 전체 갱신을 거부한다', async (invalid) => {
  const valid = { timestamp: '1704067200', value: '20', value_classification: 'Fear' };
  const broken = { ...valid, ...invalid };
  for (const data of [
    [broken, valid],
    [valid, broken],
  ]) {
    respond({ data });
    await expect(loadFearGreed()).rejects.toThrow('No valid fear & greed data');
  }
});

it.each([undefined, null, NaN, Infinity, -1])('멤풀의 잘못된 수치 %s를 거부한다', async (count) => {
  respond({ fastestFee: 1, halfHourFee: 1, hourFee: 1 }, { count, vsize: 0 });
  await expect(loadMempoolStats()).rejects.toThrow('잘못된 수치');
});

it.each(['vsize', 'fastestFee', 'halfHourFee', 'hourFee'])('멤풀 필드 %s의 누락·음수 수치를 거부한다', async (key) => {
  for (const value of [undefined, -1]) {
    const fees = { fastestFee: 1, halfHourFee: 1, hourFee: 1 };
    const mempool = { count: 0, vsize: 0 };
    respond(
      key === 'vsize' ? fees : { ...fees, [key]: value },
      key === 'vsize' ? { ...mempool, vsize: value } : mempool,
    );
    await expect(loadMempoolStats()).rejects.toThrow('잘못된 수치');
  }
});

it('비어 있는 멤풀과 0 수수료는 정상 값이다', async () => {
  respond({ fastestFee: 0, halfHourFee: 0, hourFee: 0 }, { count: 0, vsize: 0 });
  expect(await loadMempoolStats()).toMatchObject({ pendingTxCount: 0, mempoolVMB: 0, fastFee: 0 });
  respond([]);
  expect((await loadMempoolBlocks()).blocks).toEqual([]);
});

it.each([0, undefined, Infinity])('채굴 풀의 분모 %s를 거부한다', async (blockCount) => {
  respond({ blockCount, pools: [{ name: 'A', slug: 'a', blockCount: 0 }] });
  await expect(loadMiningPools()).rejects.toThrow('잘못된 블록 수');
});

it('풀의 누락된 블록 수를 거부하고 정상 점유율을 반환한다', async () => {
  respond({ blockCount: 10, pools: [{ name: 'A', slug: 'a' }] });
  await expect(loadMiningPools()).rejects.toThrow('잘못된 블록 수');
  respond({ blockCount: 10, pools: [{ name: 'A', slug: 'a', blockCount: 10 }] });
  expect((await loadMiningPools()).pools[0].sharePct).toBe(100);
});

it.each([-1, 11])('풀 블록 수 %s가 0부터 전체 블록 수까지의 범위를 벗어나면 거부한다', async (blockCount) => {
  respond({ blockCount: 10, pools: [{ name: 'A', slug: 'a', blockCount }] });
  await expect(loadMiningPools()).rejects.toThrow('잘못된 블록 수');
});

it.each([undefined, {}, []].map((pools) => ({ pools })))('잘못된 풀 목록 $pools를 거부한다', async ({ pools }) => {
  respond({ blockCount: 10, pools });
  await expect(loadMiningPools()).rejects.toThrow('잘못된 블록 수');
});

it.each([undefined, [], [NaN], [1, Infinity], [-1, 1]].map((feeRange) => ({ feeRange })))(
  '잘못된 수수료 범위 %s를 거부한다',
  async ({ feeRange }) => {
    respond([{ blockVSize: 1000000, nTx: 1, medianFee: 1, feeRange }]);
    await expect(loadMempoolBlocks()).rejects.toThrow('잘못된 블록 수치');
  },
);

it.each(['medianFee', 'nTx', 'blockVSize'])('멤풀 블록 필드 %s의 누락·음수 수치를 거부한다', async (key) => {
  for (const value of [undefined, -1]) {
    respond([{ blockVSize: 1000000, nTx: 1, medianFee: 1, feeRange: [1, 2], [key]: value }]);
    await expect(loadMempoolBlocks()).rejects.toThrow('잘못된 블록 수치');
  }
});

it('빈 객체인 멤풀 블록 응답은 fetchJson이 도메인 검증 전에 거부한다', async () => {
  respond({});
  await expect(loadMempoolBlocks()).rejects.toThrow('mempool blocks: 빈 응답');
});

it('비어 있지 않아도 배열이 아닌 멤풀 블록 응답을 거부한다', async () => {
  respond({ blocks: [] });
  await expect(loadMempoolBlocks()).rejects.toThrow('잘못된 블록 수치');
});

it('정상 블록 수치의 단위와 반올림을 유지한다', async () => {
  respond([{ blockVSize: 1000000, nTx: 1, medianFee: 2.6, feeRange: [1.1, 4.9] }]);
  expect((await loadMempoolBlocks()).blocks).toEqual([{ vMB: 1, nTx: 1, medianFee: 3, feeMin: 1, feeMax: 5 }]);
});

const difficulty = { difficultyChange: -2, remainingBlocks: 10, timeAvg: 600000, estimatedRetargetDate: 1800000000000 };
it('null 블록 높이는 fetchJson이 도메인 검증 전에 거부한다', async () => {
  respond({ hashrates: [{ avgHashrate: 500e18 }] }, difficulty, null);
  await expect(loadMiningStats()).rejects.toThrow('block height: 빈 응답');
});

it.each([900000.5, -1])('잘못된 블록 높이 %s를 거부한다', async (height) => {
  respond({ hashrates: [{ avgHashrate: 500e18 }] }, difficulty, height);
  await expect(loadMiningStats()).rejects.toThrow('잘못된 채굴 수치');
});

it('음수인 난이도 조정 잔여 블록 수를 거부한다', async () => {
  respond({ hashrates: [{ avgHashrate: 500e18 }] }, { ...difficulty, remainingBlocks: -1 }, 900000);
  await expect(loadMiningStats()).rejects.toThrow('잘못된 채굴 수치');
});

it.each([[], [{ avgHashrate: 0 }], [{ avgHashrate: Infinity }]].map((hashrates) => ({ hashrates })))(
  '잘못된 채굴 해시레이트를 거부한다',
  async ({ hashrates }) => {
    respond({ hashrates }, difficulty, 900000);
    await expect(loadMiningStats()).rejects.toThrow('잘못된 채굴 수치');
  },
);

it.each(['difficultyChange', 'remainingBlocks', 'estimatedRetargetDate'])(
  '누락된 난이도 필드 %s를 거부한다',
  async (key) => {
    respond({ hashrates: [{ avgHashrate: 500e18 }] }, { ...difficulty, [key]: undefined }, 900000);
    await expect(loadMiningStats()).rejects.toThrow('잘못된 채굴 수치');
  },
);

it.each([undefined, null, 0, -1, NaN, Infinity])(
  '잘못된 평균 블록 시간 %s는 10분으로 대체하고 채굴 통계를 반환한다',
  async (timeAvg) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    respond({ hashrates: [{ avgHashrate: 500e18 }] }, { ...difficulty, timeAvg }, 1049856);
    expect(await loadMiningStats()).toMatchObject({
      hashrateEHs: 500,
      difficultyChangePct: -2,
      remainingHalvingBlocks: 144,
      estimatedHalvingDate: '2024-01-02',
    });
  },
);

it('유효한 평균 블록 시간은 반감기 예상일에 그대로 쓴다', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
  respond({ hashrates: [{ avgHashrate: 500e18 }] }, { ...difficulty, timeAvg: 1200000 }, 1049856);
  expect((await loadMiningStats()).estimatedHalvingDate).toBe('2024-01-03');
});

it('정상 채굴 수치는 유한한 값으로 반환한다', async () => {
  respond({ hashrates: [{ avgHashrate: 400e18 }, { avgHashrate: 500e18 }] }, difficulty, 900000);
  expect(await loadMiningStats()).toMatchObject({ hashrateEHs: 500, hashrateChangePct: 25, difficultyChangePct: -2 });
});

it('최근 블록의 음수 weight를 거부하고 정상 weight는 MvB로 변환한다', async () => {
  const block = {
    height: 900000,
    timestamp: 1704067200,
    tx_count: 2000,
    weight: 4000000,
    extras: { medianFee: 2.6, pool: { name: 'A' } },
  };
  respond([{ ...block, weight: -1 }]);
  await expect(loadRecentBlocks()).rejects.toThrow('recent blocks: 잘못된 블록 수치');
  respond([block]);
  expect((await loadRecentBlocks()).blocks[0]).toMatchObject({ vMB: 1, medianFee: 3, txCount: 2000 });
});

it('FRED의 Infinity를 시리즈 ID와 함께 거부하고 정상값은 보존한다', async () => {
  respond({ observations: [{ date: '2024-01-01', value: 'Infinity' }] });
  await expect(fetchFredSeries('CPIAUCSL', 'test-key', '2024-01-01')).rejects.toThrow(
    'FRED CPIAUCSL: 잘못된 시계열 수치',
  );
  respond({ observations: [{ date: '2024-01-01', value: '100' }] });
  expect(await fetchFredSeries('CPIAUCSL', 'test-key', '2024-01-01')).toMatchObject({ current: 100 });
});

it('ECOS의 Infinity를 통계표 코드와 함께 거부하고 정상값은 보존한다', async () => {
  vi.stubEnv('ECOS_API_KEY', 'test-key');
  const normal = { StatisticSearch: { row: [{ TIME: '202401', DATA_VALUE: '100' }] } };
  const invalid = { StatisticSearch: { row: [{ TIME: '202401', DATA_VALUE: 'Infinity' }] } };
  respond(normal, normal, normal, normal, invalid, normal);
  await expect(loadInflationDataKr()).rejects.toThrow('ECOS 901Y062: 잘못된 시계열 수치');
  respond(normal, normal, normal, normal, normal, normal);
  expect(await loadInflationDataKr()).toMatchObject({ available: true, house: { current: 100 } });
});

it('CoinMetrics의 다음 페이지 data가 비면 이미 받은 시계열도 반환하지 않는다', async () => {
  const rows = Array.from({ length: 365 }, (_, index) => ({
    time: new Date(Date.UTC(2016, 0, index + 1)).toISOString(),
    CapMVRVCur: '2',
    CapMrktCurUSD: String(1000 + index),
  }));
  respond({ data: rows, next_page_token: 'page-2' }, { data: [] });
  await expect(loadMvrv()).rejects.toThrow('CoinMetrics: 빈 시계열');
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(new URL(vi.mocked(fetch).mock.calls[1][0] as string).searchParams.get('next_page_token')).toBe('page-2');

  respond({ data: rows.slice(0, 200), next_page_token: 'page-2' }, { data: rows.slice(200) });
  const result = await loadMvrv();
  expect(result.zScore).toHaveLength(1);
  expect(Number.isFinite(result.zScore[0].value)).toBe(true);
});

it.each([
  ['2024-04-19', 3, 6.25],
  ['2024-04-20', 4, 3.125],
  ['2028-04-12', 4, 3.125],
  ['2028-04-13', 5, 1.5625],
] as const)('%s에 보안 예산·게임이론의 보조금이 달력 기준으로 일치한다', async (date, era, subsidy) => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(date));
  vi.resetModules();
  const { CURRENT_ERA } = await import('@/app/security-budget/models');
  const { attack51 } = await import('@/app/bitcoin-game-theory/models');
  expect(CURRENT_ERA).toBe(era);
  expect(subsidyAtEra(CURRENT_ERA)).toBe(subsidy);
  expect(
    attack51({ btcPrice: 100000, networkHashrate: 1000, attackHours: 1, hardwareCostPerTH: 20, electricity: 0.025 })
      .honestRevenue,
  ).toBe(subsidy * 6 * 8760 * 0.5 * 100000);
});

// 추정일보다 실제 반감기가 빠르거나 늦어도 카드의 보조금·잔여 블록·예상일은 같은 높이를 따른다.
it.each([
  ['2028-04-06', 1_049_999, 3.125, 1.5625, 1, '2028-04-06'],
  ['2028-04-06', 1_050_000, 1.5625, 0.78125, 210_000, '2032-04-03'],
  ['2028-04-06', 1_050_001, 1.5625, 0.78125, 209_999, '2032-04-03'],
  ['2028-04-20', 1_049_999, 3.125, 1.5625, 1, '2028-04-20'],
  ['2028-04-20', 1_050_000, 1.5625, 0.78125, 210_000, '2032-04-17'],
  ['2028-04-20', 1_050_001, 1.5625, 0.78125, 209_999, '2032-04-17'],
] as const)(
  '%s의 높이 %i에서 채굴 카드의 반감기 수치가 일치한다',
  async (date, height, blockRewardBTC, nextRewardBTC, remainingHalvingBlocks, estimatedHalvingDate) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(date));
    respond({ hashrates: [{ avgHashrate: 500e18 }] }, difficulty, height);
    expect(await loadMiningStats()).toMatchObject({
      blockRewardBTC,
      nextRewardBTC,
      remainingHalvingBlocks,
      estimatedHalvingDate,
    });
  },
);

it.each([undefined, null, 20, '', '   '])(
  '공포지수의 과거 분류 %s는 허용하고 최신 분류는 검증한다',
  async (classification) => {
    const valid = { timestamp: '1704153600', value: '100', value_classification: 'Extreme Greed' };
    const broken = { timestamp: '1704067200', value: '50', value_classification: classification };
    for (const data of [
      [broken, valid],
      [valid, broken],
    ]) {
      respond({ data });
      expect(await loadFearGreed()).toMatchObject({
        value: 100,
        classification: 'Extreme Greed',
        history: [
          { time: '2024-01-01', value: 50 },
          { time: '2024-01-02', value: 100 },
        ],
      });
    }
    respond({ data: [broken] });
    await expect(loadFearGreed()).rejects.toThrow('No valid fear & greed data');
    respond({
      data: [
        { ...valid, timestamp: '1704067200' },
        { ...broken, timestamp: '1704153600' },
      ],
    });
    await expect(loadFearGreed()).rejects.toThrow('No valid fear & greed data');
  },
);
