import 'server-only';

import { Redis } from '@upstash/redis';

import { cacheMs, cacheShape, type EndpointKey } from './cache-config';

/**
 * 분산 POP 간 데이터·갱신시각을 일치시키는 공유 read-through 캐시.
 *
 * 각 라우트의 per-POP ISR을 대체한다. 모든 POP이 같은 Upstash 키를 읽으므로
 * `fetchedAt`과 데이터값이 전 리전에서 동일하다. 신선도 윈도우(TTL)와 응답 형태 버전은
 * cache-config.ts에서 가져온다.
 *
 * 동작(만료 시 갱신까지 블로킹):
 * - 신선하면 캐시값 즉시 반환
 * - 만료/미스 → 락(SET NX)을 획득한 한 요청만 외부 API 호출 후 캐시 기록
 * - 락에 실패한 동시 요청은 갱신 완료까지 폴링 대기(스탬피드 차단)
 *
 * 캐시 항목에는 Redis 만료를 걸지 않는다. 갱신이 실패하면 옛 값을 계속 돌려주므로
 * "외부가 실패하면 500"은 캐시에 값이 없을 때만 맞다. 값이 있으면 마지막 성공 값이 나가고
 * 갱신시각만 늘어난다. 이 경로는 `[cache]` 로그로 남긴다.
 *
 * 필요 환경변수: UPSTASH_REDIS_REST_URL·UPSTASH_REDIS_REST_TOKEN, 없으면
 * KV_REST_API_URL·KV_REST_API_TOKEN(Vercel 통합이 심는 이름). `Redis.fromEnv()`가 이 순서로 읽는다.
 */

let client: Redis | null = null;
function redis(): Redis {
  // 모듈 import가 아닌 첫 호출 시 초기화. 빌드/정적분석 단계의 env 부재 throw 방지.
  if (!client) client = Redis.fromEnv();
  return client;
}

// `v`는 응답 형태 버전(cache-config.ts의 `shape`). 버전을 넣기 전의 항목에는 없어서 0으로 읽는다.
type Entry<T> = { v?: number; freshUntil: number; data: T };

const LOCK_TTL = 30; // 락 보유 상한(초). 외부 호출이 더 길면 자동 만료.
const WAIT_TIMEOUT = 9000; // 다른 요청의 갱신을 기다리는 상한(ms).
const WAIT_INTERVAL = 300; // 폴링 간격(ms).

// 락은 요청마다 다른 토큰으로 잡고, 토큰이 같을 때만 지운다. 외부 호출이 LOCK_TTL을 넘겨
// 락이 만료된 뒤 다른 요청이 새로 잡았다면, 늦게 끝난 옛 보유자가 그 락을 지우면 안 된다.
// GET 뒤 DEL로 나누면 그 사이에 소유자가 바뀔 수 있어 비교와 삭제를 한 스크립트로 한다.
const RELEASE_LOCK =
  "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 로그에는 키 이름과 오류 종류만 남긴다. 제공처 URL에 API 키가 들어 있으므로
// (FRED는 쿼리, ECOS는 경로) 메시지 안의 URL은 지운다.
function describeError(err: unknown): string {
  if (!(err instanceof Error)) return typeof err;
  return `${err.name}: ${err.message.replace(/https?:\/\/\S+/g, '<url>')}`;
}

function logStale(key: EndpointKey, reason: string) {
  console.error(`[cache] ${key}: ${reason}. 마지막으로 저장된 값을 돌려준다`);
}

export async function cached<T>(key: EndpointKey, fetcher: () => Promise<T>): Promise<T> {
  const r = redis();
  const cacheKey = `cache:${key}`;
  const lockKey = `lock:${key}`;
  const ttlMs = cacheMs(key);
  const shape = cacheShape(key);

  // 형태 버전이 다른 항목은 새 코드의 T가 아니므로 없는 것으로 본다(stale로도 쓰지 않는다).
  const read = async (): Promise<Entry<T> | null> => {
    const raw = await r.get<Entry<T>>(cacheKey);
    return raw && (raw.v ?? 0) === shape ? raw : null;
  };

  const tryLock = async (): Promise<string | null> => {
    const token = crypto.randomUUID();
    return (await r.set(lockKey, token, { nx: true, ex: LOCK_TTL })) ? token : null;
  };

  const entry = await read();
  if (entry && Date.now() < entry.freshUntil) return entry.data;

  const refresh = async (token: string): Promise<T> => {
    try {
      let data: T;
      try {
        data = await fetcher();
      } catch (err) {
        // 갱신 실패 시 stale이라도 있으면 반환(외부 API 일시 장애 대비).
        if (entry) {
          logStale(key, `갱신 실패(${describeError(err)})`);
          return entry.data;
        }
        throw err;
      }
      // 기록 실패는 데이터 실패가 아니다. 방금 받은 값은 그대로 돌려준다.
      try {
        await r.set(cacheKey, { v: shape, freshUntil: Date.now() + ttlMs, data } satisfies Entry<T>);
      } catch (err) {
        console.error(`[cache] ${key}: 캐시 기록 실패(${describeError(err)})`);
      }
      return data;
    } finally {
      await r.eval(RELEASE_LOCK, [lockKey], [token]).catch(() => {
        // 해제에 실패해도 락은 EX(LOCK_TTL)로 풀린다.
      });
    }
  };

  // 만료/미스 → 한 요청만 외부 API를 호출하도록 락 시도.
  const token = await tryLock();
  if (token) return refresh(token);

  // 락 실패 → 다른 요청이 갱신 중. 새 값이 기록되거나 락이 풀릴 때까지 블로킹.
  let retried = false;
  const deadline = Date.now() + WAIT_TIMEOUT;
  while (Date.now() < deadline) {
    await sleep(WAIT_INTERVAL);
    // 락을 먼저 본다. 보유자는 값을 기록한 뒤에 락을 풀므로, 락이 없다고 본 다음에 읽은 값은
    // 보유자의 기록을 이미 담고 있다(순서를 바꾸면 기록 직전 값을 읽고 실패로 오판한다).
    const lockHeld = (await r.exists(lockKey)) > 0;
    const fresh = await read();
    if (fresh && Date.now() < fresh.freshUntil) return fresh.data;
    if (lockHeld) continue;

    // 락이 풀렸는데 새 값이 없다: 보유자가 실패했다. 남은 시간을 기다려도 새 값은 오지 않는다.
    if (entry) {
      logStale(key, '다른 요청의 갱신 실패');
      return entry.data;
    }
    // 콜드면 락을 한 번만 다시 잡아 본다. 대기자마다 락 없이 외부를 부르면 락이 막으려던
    // 동시 호출이 그대로 난다.
    // 다시 잡은 보유자도 실패해 락이 또 풀렸으면 더 기다리지 않는다.
    if (retried) throw new Error(`${key}: 다른 요청의 갱신 실패`);
    retried = true;
    const retryToken = await tryLock();
    if (retryToken) return refresh(retryToken);
  }

  // 대기 타임아웃 → stale이라도 반환. 콜드면 외부를 직접 부르지 않고 실패로 끝낸다
  // (보유자가 아직 받는 중이므로 클라이언트의 재시도가 그 값을 읽는다).
  if (entry) {
    logStale(key, '갱신 대기 시간 초과');
    return entry.data;
  }
  throw new Error(`${key}: 캐시 갱신 대기 시간 초과`);
}
