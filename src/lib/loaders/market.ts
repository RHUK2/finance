import 'server-only';

import { cached } from '@/lib/cache';
import type { LivePoint } from '@/lib/series';
import { barDate, yf } from '@/lib/yahoo';

import { SYMBOLS as STOCK_SYMBOLS } from './stocks';
import { SYMBOLS as STRATEGY_SYMBOLS } from './strategy';

// 일봉 히스토리(`stocks`·`strategy`·`bitcoin-historical`, 24시간)의 마지막 점만 실시간으로 바꾸는
// 시세 묶음이다. 장중에 움직이는 것은 끝점 하나뿐이라, 시계열 전체를 5분마다 다시 받지 않고 이 키만
// 300초 TTL로 받는다. 화면이 `withLivePoint`(src/lib/series.ts)로 히스토리 끝에 얹는다.
//
// BTC는 야후가 아니라 Coinbase에서 받는다. 같은 화면의 BTC 차트와 네 지표가 Coinbase 일봉
// (`bitcoin-historical`)이라, 끝점만 다른 거래소 값이면 같은 이름의 두 숫자가 어긋난다.
// Coinbase 일봉은 UTC 자정에 끊으므로 시세 시각의 UTC 날짜가 곧 그 봉의 날짜다.
const COINBASE_TICKER = 'https://api.exchange.coinbase.com/products/BTC-USD/ticker';

const YAHOO_SYMBOLS = [...STOCK_SYMBOLS, ...STRATEGY_SYMBOLS];

export type QuoteKey = 'btc' | (typeof YAHOO_SYMBOLS)[number]['key'];

export type MarketData = {
  fetchedAt: string;
  /** 키별 실시간 시세. 받지 못한 키는 빠지고, 화면은 그 키를 히스토리만으로 그린다 */
  quotes: Partial<Record<QuoteKey, LivePoint>>;
};

async function fetchBtc(): Promise<Partial<Record<QuoteKey, LivePoint>>> {
  const res = await fetch(COINBASE_TICKER, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Coinbase ticker: ${res.status}`);
  const { price, time } = (await res.json()) as { price: string; time: string };
  const value = Number(price);
  if (!Number.isFinite(value)) throw new Error('Coinbase ticker: 가격이 숫자가 아니다');
  return { btc: { time: time.slice(0, 10), value } };
}

// 심볼 전부를 한 번에 묻는다. 야후가 모르는 심볼은 결과에서 빠질 뿐 전체가 실패하지 않는다.
// 날짜는 히스토리와 같은 `barDate`로 잘라 같은 봉을 가리키게 한다(장이 닫힌 뒤에는 마지막 거래일).
async function fetchYahoo(): Promise<Partial<Record<QuoteKey, LivePoint>>> {
  const res = await yf.quote(
    YAHOO_SYMBOLS.map((s) => s.symbol),
    { return: 'object' },
  );
  const out: Partial<Record<QuoteKey, LivePoint>> = {};
  for (const { key, symbol } of YAHOO_SYMBOLS) {
    const q = res[symbol];
    if (q?.regularMarketPrice == null || !q.regularMarketTime) continue;
    out[key] = {
      time: barDate(q.regularMarketTime, q.exchangeTimezoneName),
      value: Number(q.regularMarketPrice.toFixed(2)),
    };
  }
  return out;
}

// 두 출처는 따로 실패한다. 하나가 죽어도 다른 쪽 시세는 내보내고, 둘 다 죽었을 때만 실패로 본다
// (그때는 cached가 마지막 성공 값을 계속 내보낸다).
export const loadMarket = () =>
  cached('market', async (): Promise<MarketData> => {
    const results = await Promise.allSettled([fetchBtc(), fetchYahoo()]);
    const quotes: Partial<Record<QuoteKey, LivePoint>> = {};
    for (const r of results) {
      if (r.status === 'fulfilled') Object.assign(quotes, r.value);
      else console.error(`[market] 시세 일부 실패: ${r.reason instanceof Error ? r.reason.message : r.reason}`);
    }
    if (Object.keys(quotes).length === 0) throw new Error('market: 모든 시세 출처 실패');
    return { fetchedAt: new Date().toISOString(), quotes };
  });
