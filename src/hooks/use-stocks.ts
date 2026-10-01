'use client';

import { useEndpoint } from '@/hooks/use-endpoint';
import type { StocksData } from '@/lib/loaders/stocks';
import type { StrategyData } from '@/lib/loaders/strategy';

// 응답 타입은 로더(src/lib/loaders/)가 `SYMBOLS`에서 만든다. 종목을 더하거나 이름을 바꾸면 여기가 따라온다.
// `import type`이라 서버 코드는 따라오지 않는다.
export type { StocksData, StrategyData };
export type StockKey = Exclude<keyof StocksData, 'fetchedAt'>;

export const useStocks = () => useEndpoint<StocksData>('stocks');
export const useStrategy = () => useEndpoint<StrategyData>('strategy');
