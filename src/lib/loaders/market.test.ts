import { afterEach, describe, expect, it, vi } from 'vitest';

import { yf } from '@/lib/yahoo';
import { loadMarket } from './market';

vi.mock('@/lib/cache', () => ({ cached: (_key: string, fetcher: () => Promise<unknown>) => fetcher() }));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('loadMarket', () => {
  it.each(['btc', 'yahoo', 'neither', 'both'])('출처 실패 %s를 병합한다', async (failed) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const btc = { time: '2026-10-02', value: 97000 };
    const yahoo = { time: '2026-10-02', value: 100.12 };
    vi.stubGlobal(
      'fetch',
      failed === 'btc' || failed === 'both'
        ? vi.fn().mockRejectedValue(new Error('fixture BTC failure'))
        : vi.fn().mockResolvedValue(Response.json({ price: '97000', time: '2026-10-02T12:00:00Z' })),
    );
    const quote = vi.spyOn(yf, 'quote');
    if (failed === 'yahoo' || failed === 'both') quote.mockRejectedValue(new Error('fixture Yahoo failure'));
    else
      quote.mockResolvedValue({
        MSTR: {
          regularMarketPrice: 100.123,
          regularMarketTime: new Date('2026-10-02T12:00:00Z'),
          exchangeTimezoneName: 'America/New_York',
        },
      } as never);
    if (failed === 'both') await expect(loadMarket()).rejects.toThrow('모든 시세 출처 실패');
    else {
      const result = await loadMarket();
      expect(result.quotes).toEqual({
        ...(failed === 'btc' ? {} : { btc }),
        ...(failed === 'yahoo' ? {} : { mstr: yahoo }),
      });
      expect(Number.isFinite(Date.parse(result.fetchedAt))).toBe(true);
    }
  });
});
