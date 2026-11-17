import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchFredSeries } from './fred';

afterEach(() => vi.unstubAllGlobals());

function observations(rows: { date: string; value: string }[]) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ observations: rows })));
  return fetchFredSeries('T10Y2Y', 'fixture-key', '2026-10-01');
}

describe('fetchFredSeries', () => {
  it('점 결측을 버리고 음수 관측을 숫자로 변환한다', async () => {
    const result = await observations([
      { date: '2026-10-01', value: '-0.10' },
      { date: '2026-10-02', value: '.' },
      { date: '2026-10-03', value: '-0.05' },
    ]);
    expect(result).toEqual({
      history: [
        { time: '2026-10-01', value: -0.1 },
        { time: '2026-10-03', value: -0.05 },
      ],
      current: -0.05,
      changePercent: 50,
    });
  });
  it('관측이 없거나 모두 결측이면 실패한다', async () => {
    await expect(observations([])).rejects.toThrow('빈 시계열');
    await expect(observations([{ date: '2026-10-01', value: '.' }])).rejects.toThrow('빈 시계열');
  });
});
