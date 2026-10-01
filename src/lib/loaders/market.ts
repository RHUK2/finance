import 'server-only';

import { cached } from '@/lib/cache';
import { yf } from '@/lib/yahoo';

// 자산 테이블이 사라지면서 남은 소비자는 `/bitcoin-volatility`의 두 갈래 운명 탭 하나다.
// 그 탭은 일간 종가가 아니라 실시간 시세를 써야 해서(종가는 하루 늦다) 300초 TTL의
// 이 키가 따로 남아 있다. 가격 시계열이 필요한 화면은 `stocks`·`strategy`를 쓴다.
// 그 탭이 읽는 것은 BTC 시세 하나라 응답도 `{ fetchedAt, price }` 하나다.
const SYMBOL = 'BTC-USD';

export type MarketData = {
  fetchedAt: string;
  /** BTC-USD 실시간 시세(야후 `regularMarketPrice`). 시세가 비면 null */
  price: number | null;
};

export const loadMarket = () =>
  cached('market', async (): Promise<MarketData> => {
    const quote = await yf.quote(SYMBOL);
    return { fetchedAt: new Date().toISOString(), price: quote?.regularMarketPrice ?? null };
  });
