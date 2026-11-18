import { expect, it, vi } from 'vitest';

import { cacheShape } from './cache-config';
import { loadCommodities } from './loaders/commodities';
import { loadEconomy } from './loaders/economy';
import { loadStocks } from './loaders/stocks';
import { loadStrategy } from './loaders/strategy';

vi.mock('@/lib/cache', () => ({ cached: (_key: string, fetcher: () => Promise<unknown>) => fetcher() }));
vi.mock('@/lib/yahoo', () => ({
  fetchYahooSeries: async (symbols: readonly { key: string }[]) =>
    Object.fromEntries(symbols.map(({ key }) => [key, {}])),
}));

// 배포된 shape별 응답 키 계약이다. SYMBOLS에 키를 더하거나 이름을 바꾸면 해당 shape를
// 올리고 새 버전의 목록을 추가한다. 기존 버전의 목록은 바꾸지 않는다.
// 로더를 실행해 비공개 SYMBOLS도 검증하며, Redis·외부 제공처에는 접근하지 않는다.
const contracts: Record<string, Record<number, readonly string[]>> = {
  stocks: {
    1: ['aapl', 'amzn', 'fetchedAt', 'googl', 'hynix', 'meta', 'msft', 'nke', 'nvda', 'samsung', 'spcx', 'tsla', 'tsm'],
  },
  strategy: { 1: ['fetchedAt', 'mstr', 'strc'] },
  economy: { 2: ['dxy', 'fetchedAt', 'kospi', 'nasdaq', 'us10y', 'us30y', 'usdkrw', 'vix'] },
  commodities: { 2: ['brent', 'corn', 'fetchedAt', 'gold', 'wti'] },
};

it.each([
  ['stocks', loadStocks],
  ['strategy', loadStrategy],
  ['economy', loadEconomy],
  ['commodities', loadCommodities],
] as const)('%s의 SYMBOLS 응답 키는 cache-config의 shape 계약과 일치한다', async (key, load) => {
  const expected = contracts[key][cacheShape(key)];
  expect(expected, `${key}: shape를 올렸으면 새 버전의 응답 키 계약을 추가한다`).toBeDefined();
  expect(Object.keys(await load()).sort(), `${key}: 응답 키 변경 시 shape를 올리고 새 계약을 추가한다`).toEqual(
    expected,
  );
});
