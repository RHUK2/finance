import 'server-only';

import { cached } from '@/lib/cache';
import { dedupeByTime } from '@/lib/series';

export type HashrateHistoryData = {
  fetchedAt: string;
  history: { time: string; value: number }[];
};

async function fetchHashrateHistory(): Promise<HashrateHistoryData> {
  const res = await fetch('https://mempool.space/api/v1/mining/hashrate/1y', {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`hashrate history error: ${res.status}`);

  const json = await res.json();
  const hashrates = json.hashrates as {
    timestamp: number;
    avgHashrate: number;
  }[];

  const history = dedupeByTime(
    hashrates.map((h) => ({
      time: new Date(h.timestamp * 1000).toISOString().slice(0, 10),
      value: Number((h.avgHashrate / 1e18).toFixed(2)),
    })),
  );

  return { fetchedAt: new Date().toISOString(), history };
}

export const loadHashrateHistory = () => cached('hashrate-history', fetchHashrateHistory);
