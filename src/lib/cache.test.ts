import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { cached, describeError } from './cache';
import { cacheMs, cacheShape } from './cache-config';

const fake = vi.hoisted(() => {
  const values = new Map<string, { value: unknown; expires: number }>();
  const read = (key: string): unknown => {
    const item = values.get(key);
    if (!item || item.expires <= Date.now()) return null;
    return structuredClone(item.value);
  };
  const get = vi.fn(async (key: string) => read(key));
  const set = vi.fn(async (key: string, value: unknown, opts?: { nx?: boolean; ex?: number }) => {
    if (opts?.nx && read(key) !== null) return null;
    values.set(key, { value: structuredClone(value), expires: opts?.ex ? Date.now() + opts.ex * 1000 : Infinity });
    return 'OK';
  });
  const exists = vi.fn(async (key: string) => Number(read(key) !== null));
  const evaluate = vi.fn(async (script: string, keys: string[], args: string[]) => {
    if (read(keys[0]) !== args[0]) return 0;
    if (script.includes("redis.call('set'")) return set(keys[1], JSON.parse(args[1]));
    values.delete(keys[0]);
    return 1;
  });
  return { values, get, set, exists, eval: evaluate };
});
vi.mock('@upstash/redis', () => ({ Redis: { fromEnv: () => fake } }));

const key = 'market';
const seed = (extra = {}) =>
  fake.set('cache:market', {
    v: cacheShape(key),
    freshUntil: Date.now() - 1,
    data: 'old',
    ...extra,
  });
const deferred = () => Promise.withResolvers<string>();
const tick = () => vi.advanceTimersByTimeAsync(0);
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01'));
  fake.values.clear();
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it('신선한 값은 락이나 제공처 호출 없이 반환한다', async () => {
  await seed({ freshUntil: Date.now() + 1000 });
  const fetcher = vi.fn();
  expect(await cached(key, fetcher)).toBe('old');
  expect(fetcher).not.toHaveBeenCalled();
  expect(fake.eval).not.toHaveBeenCalled();
  expect(fake.set).toHaveBeenCalledTimes(1);
});

it.each([undefined, -1])('형태 버전 %s는 stale로도 반환하지 않고 락을 해제한다', async (v) => {
  await seed({ v, retryAfter: Date.now() + 60_000 });
  await expect(
    cached(key, async () => {
      throw new Error('down');
    }),
  ).rejects.toThrow('down');
  expect(await fake.exists('lock:market')).toBe(0);
});

it.each(['freshUntil', 'retryAfter'])('락 획득 전에 기록된 %s 유효 항목은 외부 호출 없이 반환한다', async (field) => {
  await seed();
  const previous = await fake.get('cache:market');
  fake.get.mockImplementationOnce(async () => {
    await seed({ data: 'new', [field]: Date.now() + 60_000 });
    return previous;
  });
  const fetcher = vi.fn().mockRejectedValue(new Error('down'));
  expect(await cached(key, fetcher)).toBe('new');
  expect(fetcher).not.toHaveBeenCalled();
  expect(await fake.get('cache:market')).toMatchObject({ data: 'new', [field]: Date.now() + 60_000 });
  expect(await fake.exists('lock:market')).toBe(0);
});

it('갱신 실패 기록은 락 획득 뒤 다시 읽은 항목에 얹는다', async () => {
  await seed();
  const previous = await fake.get('cache:market');
  const freshUntil = Date.now() - 1000;
  fake.get.mockImplementationOnce(async () => {
    await seed({ data: 'newer', freshUntil });
    return previous;
  });
  expect(await cached(key, vi.fn().mockRejectedValue(new Error('down')))).toBe('newer');
  expect(await fake.get('cache:market')).toEqual({
    v: cacheShape(key),
    freshUntil,
    data: 'newer',
    retryAfter: Date.now() + 60_000,
  });
  expect(await fake.exists('lock:market')).toBe(0);
});

it('락 획득 뒤 형태 버전이 달라져도 갱신 실패 시 처음 읽은 값을 반환하고 기록한다', async () => {
  await seed();
  const previous = await fake.get('cache:market');
  fake.get.mockImplementationOnce(async () => {
    await seed({ v: cacheShape(key) + 1, data: 'other-shape' });
    return previous;
  });
  const fetcher = vi.fn().mockRejectedValue(new Error('down'));
  await expect(cached(key, fetcher)).resolves.toBe('old');
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(await fake.get('cache:market')).toEqual({ ...(previous as object), retryAfter: Date.now() + 60_000 });
  expect(await fake.exists('lock:market')).toBe(0);
});

it('실패 후 60초 동안 신선도·데이터를 유지하며 재시도를 억제하고 경계에서 회복한다', async () => {
  await seed();
  const before = await fake.get('cache:market');
  const fetcher = vi.fn().mockRejectedValueOnce(new Error('down')).mockResolvedValue('new');
  expect(await cached(key, fetcher)).toBe('old');
  expect(await fake.get('cache:market')).toEqual({ ...(before as object), retryAfter: Date.now() + 60_000 });
  await vi.advanceTimersByTimeAsync(59_999);
  expect(await cached(key, fetcher)).toBe('old');
  expect(fetcher).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(1);
  expect(await cached(key, fetcher)).toBe('new');
  expect(await fake.get('cache:market')).toEqual({
    v: cacheShape(key),
    freshUntil: Date.now() + cacheMs(key),
    data: 'new',
  });
  expect(await fake.exists('lock:market')).toBe(0);
});

it('외부 호출이 20초 안에 끝나지 않으면 옛 값을 반환하고 재시도를 억제한다', async () => {
  await seed();
  const before = await fake.get('cache:market');
  const provider = deferred();
  const pending = cached(key, () => provider.promise);
  const result = expect(pending).resolves.toBe('old');
  await tick();
  await vi.advanceTimersByTimeAsync(19_999);
  expect(await fake.get('cache:market')).toEqual(before);
  expect(await fake.exists('lock:market')).toBe(1);
  await vi.advanceTimersByTimeAsync(1);
  await result;
  const stale = { ...(before as object), retryAfter: Date.now() + 60_000 };
  expect(await fake.get('cache:market')).toEqual(stale);
  expect(await fake.exists('lock:market')).toBe(0);
  expect(console.error).toHaveBeenCalledWith(
    '[cache] market: 갱신 실패(Error: market: 외부 호출 시간 초과). 마지막으로 저장된 값을 돌려준다',
  );
  provider.resolve('late');
  await tick();
  expect(await fake.get('cache:market')).toEqual(stale);
  expect(vi.getTimerCount()).toBe(0);
});

it('콜드 외부 호출이 20초 안에 끝나지 않으면 실패하고 락을 해제한다', async () => {
  const provider = deferred();
  const pending = cached(key, () => provider.promise);
  const result = expect(pending).rejects.toThrow('market: 외부 호출 시간 초과');
  await vi.advanceTimersByTimeAsync(20_000);
  await result;
  expect(await fake.get('cache:market')).toBeNull();
  expect(await fake.exists('lock:market')).toBe(0);
  provider.reject(new Error('late failure'));
  await tick();
  expect(await fake.get('cache:market')).toBeNull();
  expect(vi.getTimerCount()).toBe(0);
});

it.each([false, true])('소유권을 잃은 옛 보유자의 완료(실패=%s)는 새 값·새 락을 건드리지 않는다', async (fail) => {
  await seed();
  const old = deferred();
  const pending = cached(key, () => old.promise);
  await tick();
  fake.values.delete('lock:market');
  expect(await cached(key, async () => 'new')).toBe('new');
  const latest = await fake.get('cache:market');
  await fake.set('lock:market', 'next-owner', { ex: 30 });
  if (fail) old.reject(new Error('late failure'));
  else old.resolve('late');
  expect(await pending).toBe(fail ? 'old' : 'late');
  expect(await fake.get('cache:market')).toEqual(latest);
  expect(await fake.get('lock:market')).toBe('next-owner');
  expect(console.error).toHaveBeenCalledWith('[cache] market: 락 소유권이 없어 캐시 기록을 건너뛴다');
});

it.each([false, true])('대기자는 보유자의 완료(실패=%s)를 읽고 외부를 부르지 않는다', async (fail) => {
  await seed();
  const owner = deferred();
  const first = cached(key, () => owner.promise);
  await tick();
  const fetcher = vi.fn();
  const waiting = cached(key, fetcher);
  await tick();
  if (fail) owner.reject(new Error('down'));
  else owner.resolve('new');
  await first;
  await vi.advanceTimersByTimeAsync(300);
  expect(await waiting).toBe(fail ? 'old' : 'new');
  expect(fetcher).not.toHaveBeenCalled();
  const cacheReadIndex = fake.get.mock.calls.findLastIndex(([readKey]) => readKey === 'cache:market');
  expect(fake.exists.mock.invocationCallOrder[0]).toBeLessThan(fake.get.mock.invocationCallOrder[cacheReadIndex]);
});

it.each([false, true])('대기 시간 초과는 stale 유무(%s)에 따라 반환하거나 실패한다', async (stale) => {
  if (stale) await seed();
  await fake.set('lock:market', 'owner', { ex: 30 });
  const fetcher = vi.fn();
  const pending = cached(key, fetcher);
  const result = stale ? expect(pending).resolves.toBe('old') : expect(pending).rejects.toThrow('대기 시간 초과');
  await vi.advanceTimersByTimeAsync(9000);
  await result;
  expect(fetcher).not.toHaveBeenCalled();
});

it('콜드 대기자는 락 해제 후 한 번 다시 획득한다', async () => {
  await fake.set('lock:market', 'owner', { ex: 30 });
  const fetcher = vi.fn().mockResolvedValue('new');
  const pending = cached(key, fetcher);
  await tick();
  fake.values.delete('lock:market');
  await vi.advanceTimersByTimeAsync(300);
  expect(await pending).toBe('new');
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it('콜드 재획득 경쟁에서 지면 두 번째 해제 때 더 재시도하지 않는다', async () => {
  await fake.set('lock:market', 'owner', { ex: 30 });
  const pending = cached(key, vi.fn());
  const result = expect(pending).rejects.toThrow('다른 요청의 갱신 실패');
  await tick();
  fake.values.delete('lock:market');
  fake.set.mockResolvedValueOnce(null);
  await vi.advanceTimersByTimeAsync(600);
  await result;
  expect(fake.set).toHaveBeenCalledTimes(3);
});

it.each([false, true])('기록 오류에도 성공 값 또는 stale(%s)을 반환한다', async (fail) => {
  await seed();
  fake.eval.mockRejectedValueOnce(new Error('write down'));
  const fetcher = fail
    ? async () => {
        throw new Error('provider down');
      }
    : async () => 'new';
  expect(await cached(key, fetcher)).toBe(fail ? 'old' : 'new');
  expect(await fake.exists('lock:market')).toBe(0);
});

it.each(['ENOTFOUND', 'ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT'])(
  '오류 요약에는 URL을 지우고 원인 코드 %s만 덧붙인다',
  (code) => {
    const cause = Object.assign(new Error('cause https://provider.test/private-key'), { code });
    const error = new TypeError('fetch failed https://provider.test/?api_key=secret', { cause });
    expect(describeError(error)).toBe(`TypeError: fetch failed <url> (cause.code: ${code})`);
  },
);

it.each([
  undefined,
  null,
  'ENOTFOUND',
  { message: 'private cause' },
  { code: 500 },
  { code: 'https://provider.test/secret' },
  { code: 'ENOTFOUND private message' },
  { code: 'ENOTFOUND\n' },
  { code: 'E'.repeat(65) },
])('코드가 없는 원인 또는 안전하지 않은 코드는 요약에 넣지 않는다: %j', (cause) => {
  expect(describeError(new Error('fetch failed', { cause }))).toBe('Error: fetch failed');
});

it.each(['https://provider.test/secret', null, undefined, 42])(
  'Error가 아닌 값의 원문은 출력하지 않는다: %j',
  (value) => {
    expect(describeError(value)).toBe(typeof value);
  },
);

it('캐시 갱신 실패 로그에도 안전한 원인 코드만 남긴다', async () => {
  await seed();
  const cause = Object.assign(new Error('https://provider.test/private-cause'), { code: 'ENOTFOUND' });
  const fetcher = vi.fn().mockRejectedValue(new TypeError('fetch failed https://provider.test/secret', { cause }));
  expect(await cached(key, fetcher)).toBe('old');
  expect(console.error).toHaveBeenCalledWith(
    '[cache] market: 갱신 실패(TypeError: fetch failed <url> (cause.code: ENOTFOUND)). 마지막으로 저장된 값을 돌려준다',
  );
});
