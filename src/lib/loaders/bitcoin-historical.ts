import 'server-only';

import { assertNonEmpty, fetchJson } from '@/lib/fetch-json';
import { cached } from '@/lib/cache';
import { dedupeByTime } from '@/lib/series';

export type BitcoinHistoricalData = {
  fetchedAt: string;
  history: { time: string; value: number }[];
};

// Coinbase BTC-USD 첫 일봉: 2015-07-20
const COINBASE_START_MS = Date.UTC(2015, 6, 20);
const CHUNK_DAYS = 300;
const DAY_MS = 86_400_000;

async function fetchBitcoinHistorical(): Promise<BitcoinHistoricalData> {
  // 청크 범위는 미리 다 알 수 있으므로 병렬로 요청 (Coinbase 공개 rate limit을 고려해 배치 단위)
  const ranges: { startMs: number; endMs: number }[] = [];
  const nowMs = Date.now();
  for (let startMs = COINBASE_START_MS; startMs < nowMs;) {
    const endMs = Math.min(startMs + CHUNK_DAYS * DAY_MS, nowMs);
    ranges.push({ startMs, endMs });
    startMs = endMs + DAY_MS;
  }

  const history: { time: string; value: number }[] = [];
  const BATCH = 8;
  for (let i = 0; i < ranges.length; i += BATCH) {
    const chunks = await Promise.all(
      ranges.slice(i, i + BATCH).map(async ({ startMs, endMs }) => {
        const start = new Date(startMs).toISOString();
        const end = new Date(endMs).toISOString();
        const url = `https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=86400&start=${start}&end=${end}`;

        // [timestamp_sec, low, high, open, close, volume], 내림차순 반환
        const candles = await fetchJson<[number, number, number, number, number, number][]>(url, `Coinbase BTC-USD`);

        // 상장 뒤 BTC-USD 거래 구간만 요청한다. 일부 청크라도 비면 장애로 보고 정상 캐시를 보존한다.
        assertNonEmpty(candles, 'Coinbase BTC-USD 청크');
        if (
          candles.some(
            ([tSec, , , , close]) =>
              !Number.isFinite(new Date(tSec * 1000).getTime()) || !Number.isFinite(close) || close <= 0,
          )
        ) {
          throw new Error('Coinbase BTC-USD: 잘못된 일봉');
        }
        return candles.map(([tSec, , , , close]) => ({
          time: new Date(tSec * 1000).toISOString().slice(0, 10),
          value: close,
        }));
      }),
    );
    for (const chunk of chunks) history.push(...chunk);
  }

  // 빈 응답은 실패로 본다. 빈 값을 캐시에 넣으면 하루 동안 빈 차트가 신선한 값으로 남는다.
  assertNonEmpty(history, 'Coinbase BTC-USD');

  // Coinbase는 내림차순이므로 날짜 오름차순으로 정렬
  history.sort((a, b) => a.time.localeCompare(b.time));

  return { fetchedAt: new Date().toISOString(), history: dedupeByTime(history) };
}

export const loadBitcoinHistorical = () => cached('bitcoin-historical', fetchBitcoinHistorical);
