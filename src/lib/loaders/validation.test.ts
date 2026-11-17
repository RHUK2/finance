import { afterEach, expect, it, vi } from 'vitest';

import { loadFearGreed } from './fear-greed';
import { loadHashrateHistory } from './hashrate-history';
import { loadMempoolBlocks } from './mempool-blocks';
import { loadMempoolStats } from './mempool-stats';
import { loadMiningPools } from './mining-pools';
import { loadMiningStats } from './mining-stats';

vi.mock('@/lib/cache', () => ({ cached: (_key: string, fetcher: () => Promise<unknown>) => fetcher() }));
afterEach(() => vi.unstubAllGlobals());
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

it('공포지수를 정렬·중복 제거·유한값 필터링하고 최신 관측의 분류를 쓴다', async () => {
  const row = (timestamp: string, value: string, classification = 'Fear') => ({
    timestamp,
    value,
    value_classification: classification,
  });
  respond({
    data: [
      row('1704067200', '20'),
      row('1704153600', '70', 'Greed'),
      row('1704153601', '71'),
      row('1704240000', 'NaN'),
      row('bad', '50'),
    ],
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
  await expect(loadFearGreed()).rejects.toThrow('No valid');
});

it.each([undefined, null, NaN, Infinity, -1])('멤풀의 잘못된 수치 %s를 거부한다', async (count) => {
  respond({ fastestFee: 1, halfHourFee: 1, hourFee: 1 }, { count, vsize: 0 });
  await expect(loadMempoolStats()).rejects.toThrow('잘못된 수치');
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
  await expect(loadMiningPools()).rejects.toThrow();
  respond({ blockCount: 10, pools: [{ name: 'A', slug: 'a', blockCount: 10 }] });
  expect((await loadMiningPools()).pools[0].sharePct).toBe(100);
});

it.each([[], [NaN], [1, Infinity]].map((feeRange) => ({ feeRange })))(
  '잘못된 수수료 범위 %s를 거부한다',
  async ({ feeRange }) => {
    respond([{ blockVSize: 1000000, nTx: 1, medianFee: 1, feeRange }]);
    await expect(loadMempoolBlocks()).rejects.toThrow('잘못된 블록 수치');
  },
);

it('정상 블록 수치의 단위와 반올림을 유지한다', async () => {
  respond([{ blockVSize: 1000000, nTx: 1, medianFee: 2.6, feeRange: [1.1, 4.9] }]);
  expect((await loadMempoolBlocks()).blocks).toEqual([{ vMB: 1, nTx: 1, medianFee: 3, feeMin: 1, feeMax: 5 }]);
});

const difficulty = { difficultyChange: -2, remainingBlocks: 10, timeAvg: 600000, estimatedRetargetDate: 1800000000000 };
it.each([[], [{ avgHashrate: 0 }], [{ avgHashrate: Infinity }]].map((hashrates) => ({ hashrates })))(
  '잘못된 채굴 해시레이트를 거부한다',
  async ({ hashrates }) => {
    respond({ hashrates }, difficulty, 900000);
    await expect(loadMiningStats()).rejects.toThrow('잘못된 채굴 수치');
  },
);

it.each(['difficultyChange', 'remainingBlocks', 'timeAvg', 'estimatedRetargetDate'])(
  '누락된 난이도 필드 %s를 거부한다',
  async (key) => {
    respond({ hashrates: [{ avgHashrate: 500e18 }] }, { ...difficulty, [key]: undefined }, 900000);
    await expect(loadMiningStats()).rejects.toThrow('잘못된 채굴 수치');
  },
);

it('정상 채굴 수치는 유한한 값으로 반환한다', async () => {
  respond({ hashrates: [{ avgHashrate: 400e18 }, { avgHashrate: 500e18 }] }, difficulty, 900000);
  expect(await loadMiningStats()).toMatchObject({ hashrateEHs: 500, hashrateChangePct: 25, difficultyChangePct: -2 });
});
