import { afterEach, expect, it, vi } from 'vitest';

import { loadBitcoinHistorical } from './bitcoin-historical';

vi.mock('@/lib/cache', () => ({ cached: (_key: string, fetcher: () => Promise<unknown>) => fetcher() }));
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it('여러 청크의 역순 일봉을 종가 기준으로 합쳐 날짜순으로 반환한다', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2016-06-01T00:00:00Z'));
  const fetcher = vi.fn().mockImplementation(async (url: string) => {
    const start = new Date(new URL(url).searchParams.get('start')!).getTime() / 1000;
    return {
      ok: true,
      json: async () => [
        [start + 86400, 1, 9, 3, 7, 99],
        [start, 1, 9, 3, 5, 99],
      ],
    };
  });
  vi.stubGlobal('fetch', fetcher);
  const result = await loadBitcoinHistorical();
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(result).toEqual({
    fetchedAt: '2016-06-01T00:00:00.000Z',
    history: [
      { time: '2015-07-20', value: 5 },
      { time: '2015-07-21', value: 7 },
      { time: '2016-05-16', value: 5 },
      { time: '2016-05-17', value: 7 },
    ],
  });
});

it.each([true, false])('빈 응답 또는 실패한 청크(ok=%s)를 캐시할 값으로 반환하지 않는다', async (ok) => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2015-07-22'));
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok, status: 503, json: async () => [] }));
  await expect(loadBitcoinHistorical()).rejects.toThrow(ok ? '빈 시계열' : '503');
});
