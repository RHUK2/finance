import 'server-only';

import { cached } from '@/lib/cache';
import type { MacroSeries } from '@/lib/series';
import { fetchYahooSeries } from '@/lib/yahoo';

const SYMBOLS = [
  { key: 'gold', symbol: 'GC=F' },
  { key: 'wti', symbol: 'CL=F' },
  { key: 'brent', symbol: 'BZ=F' },
  { key: 'corn', symbol: 'ZC=F' },
] as const;

// 응답 모양. 훅(src/hooks/)이 `import type`으로 받아 `SYMBOLS`의 키가 곧 화면이 읽는 필드가 된다.
// 타입만 가져가므로 yahoo-finance2가 클라이언트 번들에 끌려가지 않는다.
export type CommoditiesData = { fetchedAt: string } & Record<(typeof SYMBOLS)[number]['key'], MacroSeries>;

export const loadCommodities = () =>
  cached('commodities', async (): Promise<CommoditiesData> => ({
    fetchedAt: new Date().toISOString(),
    ...(await fetchYahooSeries(SYMBOLS)),
  }));
