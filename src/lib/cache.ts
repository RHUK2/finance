import { Redis } from "@upstash/redis";

import { cacheSeconds, type EndpointKey } from "./cache-config";

/**
 * 분산 POP 간 데이터·갱신시각을 일치시키는 공유 read-through 캐시.
 *
 * 각 라우트의 per-POP ISR을 대체한다. 모든 POP이 같은 Upstash 키를 읽으므로
 * `fetchedAt`과 데이터값이 전 리전에서 동일하다. 신선도 윈도우(TTL)는
 * cache-config.ts에서 파생한다.
 *
 * 동작(만료 시 갱신까지 블로킹):
 * - 신선하면 캐시값 즉시 반환
 * - 만료/미스 → 락(SET NX)을 획득한 한 요청만 외부 API 호출 후 캐시 기록
 * - 락에 실패한 동시 요청은 갱신 완료까지 폴링 대기(스탬피드 차단)
 *
 * 필요 환경변수: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 */

let client: Redis | null = null;
function redis(): Redis {
  // 모듈 import가 아닌 첫 호출 시 초기화 — 빌드/정적분석 단계의 env 부재 throw 방지.
  if (!client) client = Redis.fromEnv();
  return client;
}

type Entry<T> = { freshUntil: number; data: T };

const LOCK_TTL = 30; // 락 보유 상한(초). 외부 호출이 더 길면 자동 만료.
const WAIT_TIMEOUT = 9000; // 다른 요청의 갱신을 기다리는 상한(ms).
const WAIT_INTERVAL = 300; // 폴링 간격(ms).

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function cached<T>(
  key: EndpointKey,
  fetcher: () => Promise<T>,
): Promise<T> {
  const r = redis();
  const cacheKey = `cache:${key}`;
  const lockKey = `lock:${key}`;
  const ttlMs = cacheSeconds(key) * 1000;

  const entry = await r.get<Entry<T>>(cacheKey);
  if (entry && Date.now() < entry.freshUntil) return entry.data;

  // 만료/미스 → 한 요청만 외부 API를 호출하도록 락 시도.
  const locked = await r.set(lockKey, "1", { nx: true, ex: LOCK_TTL });

  if (locked) {
    try {
      const data = await fetcher();
      await r.set(cacheKey, { freshUntil: Date.now() + ttlMs, data });
      return data;
    } catch (err) {
      // 갱신 실패 시 stale이라도 있으면 반환(외부 API 일시 장애 대비).
      if (entry) return entry.data;
      throw err;
    } finally {
      await r.del(lockKey);
    }
  }

  // 락 실패 → 다른 요청이 갱신 중. 새 값이 기록될 때까지 블로킹.
  const deadline = Date.now() + WAIT_TIMEOUT;
  while (Date.now() < deadline) {
    await sleep(WAIT_INTERVAL);
    const fresh = await r.get<Entry<T>>(cacheKey);
    if (fresh && Date.now() < fresh.freshUntil) return fresh.data;
  }

  // 대기 타임아웃 → stale이라도 반환, 없으면(콜드 스타트) 직접 호출.
  if (entry) return entry.data;
  return fetcher();
}
