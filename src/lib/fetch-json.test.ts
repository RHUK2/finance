import { inspect } from 'node:util';

import { afterEach, expect, it, vi } from 'vitest';

import { assertNonEmpty, fetchJson } from './fetch-json';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it('no-store와 기본 15초 제한을 적용하고 숫자 0을 보존한다', async () => {
  const timeout = vi.spyOn(AbortSignal, 'timeout');
  const fetcher = vi.fn().mockResolvedValue(Response.json(0));
  vi.stubGlobal('fetch', fetcher);
  expect(await fetchJson('https://example.com', 'test')).toBe(0);
  expect(timeout).toHaveBeenCalledWith(15_000);
  expect(fetcher).toHaveBeenCalledWith('https://example.com', { cache: 'no-store', signal: expect.any(AbortSignal) });
});

it.each([null, '', [], {}])('빈 JSON %j는 실패한다', async (value) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(value)));
  await expect(fetchJson('https://example.com', 'test')).rejects.toThrow('test: 빈 응답');
});

it('HTTP 실패와 JSON이 아닌 본문은 실패한다', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(new Response('down', { status: 503 }))
    .mockResolvedValueOnce(new Response('not json'));
  vi.stubGlobal('fetch', fetcher);
  await expect(fetchJson('https://example.com', 'test')).rejects.toThrow('test: HTTP 503');
  await expect(fetchJson('https://example.com', 'test')).rejects.toThrow('test: 요청 또는 JSON 해석 실패');
});

it('멈춘 요청은 지정한 제한 시간에 중단하고 URL의 키를 노출하지 않는다', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      (_url, { signal }: RequestInit) =>
        new Promise((_resolve, reject) => {
          signal!.addEventListener('abort', () => reject(signal!.reason), { once: true });
        }),
    ),
  );
  await expect(fetchJson('https://example.com?key=secret', 'test', { timeoutMs: 10 })).rejects.toThrow(
    /^test: 시간 초과$/,
  );
});

it('본문을 읽는 중 시간 초과도 실패한다', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url, { signal }: RequestInit) => ({
      ok: true,
      json: () =>
        new Promise((_resolve, reject) => {
          signal!.addEventListener('abort', () => reject(signal!.reason), { once: true });
        }),
    })),
  );
  await expect(fetchJson('https://example.com', 'test', { timeoutMs: 10 })).rejects.toThrow('시간 초과');
});

it('시계열은 빈 배열과 배열 아닌 값을 거부한다', () => {
  expect(() => assertNonEmpty([], 'series')).toThrow('빈 시계열');
  expect(() => assertNonEmpty(null as unknown as number[], 'series')).toThrow('빈 시계열');
  expect(() => assertNonEmpty([0], 'series')).not.toThrow();
});

it.each([new TypeError('fetch failed'), new SyntaxError('Unexpected token in JSON')])(
  '원인 종류와 URL 없는 메시지를 보존한다: %s',
  async (cause) => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(cause));
    const error = await fetchJson('https://example.com?key=secret', 'test').catch((error: unknown) => error);
    expect(error).toMatchObject({ cause: { name: cause.name, message: cause.message } });
    expect(inspect(error)).not.toContain('secret');
    expect(inspect(error)).not.toContain('https://');
  },
);

it.each(['https://example.com?key=secret', 'https://ecos.example/api/secret/json'])(
  '원인 메시지·스택·중첩 cause의 URL을 노출하지 않는다: %s',
  async (url) => {
    const original = new TypeError(`Failed to parse URL from ${url}`, { cause: new Error(url) });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(original));
    const error = await fetchJson(url, 'test').catch((error: unknown) => error);
    expect(error).toMatchObject({
      message: 'test: 요청 또는 JSON 해석 실패',
      cause: { name: 'TypeError', message: 'URL이 포함된 오류 메시지 생략' },
    });
    expect(inspect(error, { depth: null })).not.toContain(url);
    expect(inspect(error, { depth: null })).not.toContain('secret');
    expect(inspect(error, { depth: null })).not.toContain('https://');
  },
);
