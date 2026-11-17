import 'server-only';

import { assertNonEmpty, fetchJson } from '@/lib/fetch-json';
import { cached } from '@/lib/cache';
import { dedupeByTime } from '@/lib/series';

export type HashrateHistoryData = {
  fetchedAt: string;
  history: { time: string; value: number }[];
};

async function fetchHashrateHistory(): Promise<HashrateHistoryData> {
  const json = await fetchJson<{ hashrates: { timestamp: number; avgHashrate: number }[] }>(
    'https://mempool.space/api/v1/mining/hashrate/1y',
    `hashrate history`,
  );
  const hashrates = json.hashrates as {
    timestamp: number;
    avgHashrate: number;
  }[];

  assertNonEmpty(hashrates, 'hashrate history');
  if (hashrates.some((h) => !Number.isFinite(h.avgHashrate) || h.avgHashrate <= 0)) {
    throw new Error('hashrate history: 잘못된 해시레이트');
  }

  const history = dedupeByTime(
    hashrates.map((h) => ({
      time: new Date(h.timestamp * 1000).toISOString().slice(0, 10),
      value: Number((h.avgHashrate / 1e18).toFixed(2)),
    })),
  );

  assertNonEmpty(history, 'hashrate history');

  return { fetchedAt: new Date().toISOString(), history };
}

export const loadHashrateHistory = () => cached('hashrate-history', fetchHashrateHistory);
