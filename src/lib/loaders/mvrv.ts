import 'server-only';

import { mvrvZScore } from '@/lib/bitcoin-models';
import { cached } from '@/lib/cache';
import { dedupeByTime } from '@/lib/series';

export type MvrvData = {
  fetchedAt: string;
  zScore: { time: string; value: number }[];
};

// Z-Score의 분모(시가총액 표준편차)는 첫 관측부터 누적한다. 천장 7·바닥 0.1 기준선은 2010년부터
// 전체 역사로 잰 값이라 시작을 늦추면 표준편차가 달라져 같은 날의 값이 낮아진다. 2015년부터 재면
// 2021년 2월 고점이 7.15가 아니라 6.12로 나와 천장 기준선에 닿지 않는다(2026-10 CoinMetrics로 대조).
// 그래서 받는 것은 CoinMetrics의 첫 관측(2010-07)부터이고, 화면에 내보내는 구간만 예전처럼 둔다.
const FETCH_START = '2010-01-01';
const DISPLAY_START = '2016-01-01';

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
      start_time: FETCH_START,
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
  const zScore = mvrvZScore(merged).filter((p) => p.time >= DISPLAY_START);
  if (zScore.length === 0) throw new Error('No MVRV Z-Score data');

  return {
    fetchedAt: new Date().toISOString(),
    zScore,
  };
}

export const loadMvrv = () => cached('mvrv', fetchMvrv);
