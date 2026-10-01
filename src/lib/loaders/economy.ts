import 'server-only';

import { cached } from '@/lib/cache';
import type { MacroSeries } from '@/lib/series';
import { fetchYahooSeries } from '@/lib/yahoo';

const SYMBOLS = [
  { key: 'dxy', symbol: 'DX-Y.NYB' },
  { key: 'us10y', symbol: '^TNX' },
  { key: 'us30y', symbol: '^TYX' },
  { key: 'vix', symbol: '^VIX' },
  { key: 'nasdaq', symbol: '^IXIC' },
  { key: 'kospi', symbol: '^KS11' },
  { key: 'usdkrw', symbol: 'USDKRW=X' },
] as const;

// 응답 모양. 훅(src/hooks/)이 `import type`으로 받아 `SYMBOLS`의 키가 곧 화면이 읽는 필드가 된다.
// 타입만 가져가므로 yahoo-finance2가 클라이언트 번들에 끌려가지 않는다.
export type EconomyData = { fetchedAt: string } & Record<(typeof SYMBOLS)[number]['key'], MacroSeries>;

export const loadEconomy = () =>
  cached('economy', async (): Promise<EconomyData> => ({
    fetchedAt: new Date().toISOString(),
    ...(await fetchYahooSeries(SYMBOLS)),
  }));
