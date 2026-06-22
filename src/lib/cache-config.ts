/**
 * 데이터 신선도 단일 출처.
 *
 * 각 엔드포인트의 키 = TanStack Query queryKey = `/api/<key>` 경로 세그먼트.
 * 여기 정의한 초(seconds)에서 클라이언트 `staleTime`/`refetchInterval`,
 * server prefetch의 `staleTime`을 모두 파생시켜 두 캐싱 레이어가 같은 윈도우로
 * 움직이게 한다.
 *
 * 라우트 핸들러의 `export const revalidate`는 Next 정적 분석 제약상 리터럴만
 * 허용되어 여기서 import해 쓸 수 없다. 각 `route.ts`의 리터럴이 이 표를 미러링하며,
 * 값을 바꿀 땐 양쪽을 함께 수정한다.
 */
export const ENDPOINTS = {
  market: 300,
  "mempool-stats": 60,
  "mining-stats": 600,
  "lightning-stats": 3600,
  "mining-pools": 600,
  "recent-blocks": 60,
  "hashrate-history": 600,
  "mempool-blocks": 60,
  economy: 3600,
  commodities: 3600,
  fred: 86400,
  "fear-greed": 86400,
  mvrv: 86400,
  "bitcoin-historical": 86400,
} as const;

export type EndpointKey = keyof typeof ENDPOINTS;

/** 엔드포인트의 신선도 윈도우를 초 단위로 반환 (ISR revalidate, fetch next.revalidate). */
export const cacheSeconds = (key: EndpointKey): number => ENDPOINTS[key];

/** 엔드포인트의 신선도 윈도우를 밀리초 단위로 반환 (TanStack staleTime, refetchInterval). */
export const cacheMs = (key: EndpointKey): number => ENDPOINTS[key] * 1000;
