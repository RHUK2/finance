import { afterEach, expect, it, vi } from 'vitest';

import { cached } from '@/lib/cache';

import { loadFred } from './fred';
import { loadInflationData } from './inflation-data';
import { loadInflationDataKr } from './inflation-data-kr';

vi.mock('@/lib/cache', () => ({ cached: vi.fn((_key: string, fetcher: () => Promise<unknown>) => fetcher()) }));

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const loaders = [
  { endpoint: 'fred', env: 'FRED_API_KEY', load: loadFred },
  { endpoint: 'inflation-data', env: 'FRED_API_KEY', load: loadInflationData },
  { endpoint: 'inflation-data-kr', env: 'ECOS_API_KEY', load: loadInflationDataKr },
];

it.each(loaders)(
  '$endpoint는 키가 없으면 캐시·외부 API를 건너뛰고 키 추가 즉시 데이터를 읽는다',
  async ({ endpoint, env, load }) => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        observations: [{ date: '2024-01-01', value: '100' }],
        StatisticSearch: { row: [{ TIME: '202401', DATA_VALUE: '100' }] },
      }),
    }));
    vi.stubGlobal('fetch', fetchMock);
    for (const absent of [undefined, '']) {
      vi.stubEnv(env, absent);
      const result = await load();
      expect(result).toEqual({ fetchedAt: expect.any(String), available: false });
      expect(Number.isFinite(Date.parse(result.fetchedAt))).toBe(true);
    }
    expect(cached).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();

    vi.stubEnv(env, 'test-api-key');
    expect(await load()).toMatchObject({ available: true });
    expect(cached).toHaveBeenCalledWith(endpoint, expect.any(Function));
    expect(fetchMock).toHaveBeenCalled();
    for (const [url] of vi.mocked(fetch).mock.calls) {
      expect(String(url)).toContain('test-api-key');
    }

    vi.stubEnv(env, undefined);
    expect(await load()).toEqual({ fetchedAt: expect.any(String), available: false });
    expect(cached).toHaveBeenCalledTimes(1);
  },
);
