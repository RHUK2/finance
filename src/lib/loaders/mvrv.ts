import 'server-only';

import { mvrvZScore } from '@/lib/bitcoin-models';
import { cached } from '@/lib/cache';
import { dedupeByTime } from '@/lib/series';

export type MvrvData = {
  fetchedAt: string;
  zScore: { time: string; value: number }[];
};

async function fetchMvrv(): Promise<MvrvData> {
  type Row = { time: string; CapMVRVCur: string; CapMrktCurUSD: string };
  const rows: Row[] = [];
  let nextPageToken: string | null = null;

  do {
    const params = new URLSearchParams({
      assets: 'btc',
      metrics: 'CapMVRVCur,CapMrktCurUSD',
      frequency: '1d',
      page_size: '2000',
      start_time: '2015-01-01',
    });
    if (nextPageToken) params.set('next_page_token', nextPageToken);

    const res = await fetch(`https://community-api.coinmetrics.io/v4/timeseries/asset-metrics?${params}`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`CoinMetrics error: ${res.status}`);

    const json = await res.json();
    rows.push(...((json.data as Row[]) ?? []));
    nextPageToken = (json.next_page_token as string) ?? null;
  } while (nextPageToken);

  if (rows.length === 0) throw new Error('No MVRV data');

  const merged = dedupeByTime(
    rows
      .map((row) => ({
        time: row.time.slice(0, 10),
        mvrv: Number(row.CapMVRVCur),
        marketCap: Number(row.CapMrktCurUSD),
      }))
      .filter((row) => isFinite(row.mvrv)),
  ).sort((a, b) => a.time.localeCompare(b.time));

  // 화면(MVRV Z-Score 차트)은 zScore만 읽는다. MVRV 원시 시계열은 `/` HTML에 dehydrate돼
  // 실리므로 소비처 없이 내보내지 않는다.
  const zScore = mvrvZScore(merged);
  if (zScore.length === 0) throw new Error('No MVRV Z-Score data');

  return {
    fetchedAt: new Date().toISOString(),
    zScore,
  };
}

export const loadMvrv = () => cached('mvrv', fetchMvrv);
