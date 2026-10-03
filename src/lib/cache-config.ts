/**
 * 데이터 신선도와 응답 형태의 단일 출처.
 *
 * 각 엔드포인트의 키 = TanStack Query queryKey = `/api/<key>` 경로 세그먼트.
 * `ttl`(초)에서 클라이언트 `staleTime`/`refetchInterval`(use-endpoint.ts)과
 * 서버 공유 캐시의 신선 기간(cache.ts의 `freshUntil`)을 함께 파생시킨다. 두 층은 같은 길이의 창을
 * 쓰지만 위상은 맞추지 않는다. 클라이언트는 응답을 받은 시각부터 세고, 서버 항목이 언제 만들어졌는지는
 * 모른다. 그래서 만료 직전 항목을 받은 탭은 거기서 다시 한 창을 기다려, 화면 값의 나이는 최대 약 두 창이다.
 * 갱신시각 라벨은 응답의 `fetchedAt` 기준이라 이 나이를 그대로 보인다.
 *
 * 서버 측 신선도는 `cached()`(src/lib/cache.ts)가 이 표를 직접 import해 쓴다. `route.ts`에
 * `export const revalidate` 리터럴을 미러링하지 않는다.
 *
 * `shape`는 응답 형태 버전이다. 캐시 항목은 만료되지 않고 갱신이 실패하면 옛 값을
 * 계속 내보내므로(cache.ts), 필드 이름을 바꾸거나 새 필드를 더하거나 값의 단위를 바꾸는
 * 커밋은 그 키의 `shape`를 올린다. 버전이 다른 항목은 없는 것으로 보고 새로 받는다.
 * 필드를 빼기만 하는 변경은 옛 항목을 읽어도 깨지지 않으므로 올리지 않아도 된다.
 * 버전이 없던 시절의 항목은 0으로 읽는다.
 */
export const ENDPOINTS = {
  market: { ttl: 300, shape: 2 },
  stocks: { ttl: 86400, shape: 0 },
  strategy: { ttl: 86400, shape: 0 },
  'mempool-stats': { ttl: 300, shape: 1 },
  'mining-stats': { ttl: 300, shape: 0 },
  'mining-pools': { ttl: 86400, shape: 0 },
  'recent-blocks': { ttl: 300, shape: 0 },
  'hashrate-history': { ttl: 86400, shape: 0 },
  'mempool-blocks': { ttl: 300, shape: 0 },
  economy: { ttl: 86400, shape: 1 },
  commodities: { ttl: 86400, shape: 1 },
  fred: { ttl: 86400, shape: 1 },
  'fear-greed': { ttl: 86400, shape: 0 },
  mvrv: { ttl: 86400, shape: 0 },
  'bitcoin-historical': { ttl: 86400, shape: 0 },
  'inflation-data': { ttl: 86400, shape: 0 },
  'inflation-data-kr': { ttl: 86400, shape: 0 },
} as const satisfies Record<string, { ttl: number; shape: number }>;

export type EndpointKey = keyof typeof ENDPOINTS;

/** 엔드포인트의 신선도 창을 밀리초 단위로 반환 (TanStack staleTime·refetchInterval, 공유 캐시의 freshUntil). */
export const cacheMs = (key: EndpointKey): number => ENDPOINTS[key].ttl * 1000;

/** 엔드포인트 응답의 형태 버전. 캐시 항목의 버전과 다르면 cache.ts가 miss로 본다. */
export const cacheShape = (key: EndpointKey): number => ENDPOINTS[key].shape;
