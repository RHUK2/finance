import 'server-only';

import type { EndpointKey } from '@/lib/cache-config';

import { loadBitcoinHistorical } from './bitcoin-historical';
import { loadCommodities } from './commodities';
import { loadEconomy } from './economy';
import { loadFearGreed } from './fear-greed';
import { loadFred } from './fred';
import { loadHashrateHistory } from './hashrate-history';
import { loadInflationData } from './inflation-data';
import { loadInflationDataKr } from './inflation-data-kr';
import { loadMarket } from './market';
import { loadMempoolBlocks } from './mempool-blocks';
import { loadMempoolStats } from './mempool-stats';
import { loadMiningPools } from './mining-pools';
import { loadMiningStats } from './mining-stats';
import { loadMvrv } from './mvrv';
import { loadRecentBlocks } from './recent-blocks';
import { loadStocks } from './stocks';
import { loadStrategy } from './strategy';

/**
 * 엔드포인트 키 → 로더. 로더 하나가 `/api/<key>` 라우트와 서버 prefetch(src/lib/prefetch.ts)가
 * 함께 부르는 함수다. 둘 다 같은 `cached(key, fetcher)`를 거치므로 공유 캐시 한 벌을 읽는다.
 *
 * 라우트는 이 표가 아니라 자기 로더 파일을 직접 import한다. 표를 거치면 라우트 하나가
 * 열일곱 로더(와 yahoo-finance2)를 모두 끌고 간다.
 */
export const LOADERS = {
  market: loadMarket,
  stocks: loadStocks,
  strategy: loadStrategy,
  'mempool-stats': loadMempoolStats,
  'mining-stats': loadMiningStats,
  'mining-pools': loadMiningPools,
  'recent-blocks': loadRecentBlocks,
  'hashrate-history': loadHashrateHistory,
  'mempool-blocks': loadMempoolBlocks,
  economy: loadEconomy,
  commodities: loadCommodities,
  fred: loadFred,
  'fear-greed': loadFearGreed,
  mvrv: loadMvrv,
  'bitcoin-historical': loadBitcoinHistorical,
  'inflation-data': loadInflationData,
  'inflation-data-kr': loadInflationDataKr,
} as const satisfies Record<EndpointKey, () => Promise<unknown>>;
