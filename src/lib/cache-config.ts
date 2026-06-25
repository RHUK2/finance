/**
 * 데이터 신선도 단일 출처.
 *
 * 각 엔드포인트의 키 = TanStack Query queryKey = `/api/<key>` 경로 세그먼트.
 * 여기 정의한 초(seconds)에서 클라이언트 `staleTime`/`refetchInterval`,
 * server prefetch의 `staleTime`을 모두 파생시켜 두 캐싱 레이어가 같은 윈도우로
 * 움직이게 한다.
 *
 * 서버 측 신선도는 라우트 핸들러가 `cached()`(src/lib/cache.ts)에서 이 표를
 * 직접 import해 Upstash 공유 캐시의 TTL로 쓴다. 더 이상 `route.ts`에
 * `export const revalidate` 리터럴을 미러링하지 않는다.
 */
export const ENDPOINTS = {
  market: 300,
  "mempool-stats": 300,
  "mining-stats": 300,
  "mining-pools": 86400,
  "recent-blocks": 300,
  "hashrate-history": 86400,
  "mempool-blocks": 300,
  economy: 86400,
  commodities: 86400,
  fred: 86400,
  "fear-greed": 86400,
  mvrv: 86400,
  "bitcoin-historical": 86400,
  "inflation-data": 86400,
  "inflation-data-kr": 86400,
} as const;

export type EndpointKey = keyof typeof ENDPOINTS;

/** 엔드포인트의 신선도 윈도우를 초 단위로 반환 (ISR revalidate, fetch next.revalidate). */
export const cacheSeconds = (key: EndpointKey): number => ENDPOINTS[key];

/** 엔드포인트의 신선도 윈도우를 밀리초 단위로 반환 (TanStack staleTime, refetchInterval). */
export const cacheMs = (key: EndpointKey): number => ENDPOINTS[key] * 1000;
