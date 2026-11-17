import 'server-only';

import { cachedWithKey } from '@/lib/cached-with-key';
import { fetchFredSeries } from '@/lib/fred';
import type { MacroSeries } from '@/lib/series';

export type FredData = {
  fetchedAt: string;
  available: boolean;
  fedFunds?: MacroSeries;
  us2y?: MacroSeries;
  /** 10Y−2Y(FRED `T10Y2Y`, 단위 %p) */
  spread?: MacroSeries;
};

export async function loadFred(): Promise<FredData> {
  return cachedWithKey('fred', 'FRED_API_KEY', async (key) => {
    const start = new Date(Date.now() - 10 * 365 * 86_400_000).toISOString().slice(0, 10);
    // 스프레드는 FRED가 공표하는 10Y−2Y(`T10Y2Y` = DGS10 − DGS2)를 그대로 받는다. 야후 ^TNX에서
    // DGS2를 빼면 산출 방식과 기준 시각이 다른 두 값을 잇게 되어 0 근처 부호가 공표값과 갈린다.
    // FEDFUNDS는 월평균 시계열이라 관측일이 매월 1일이다(화면은 `frequency='monthly'`).
    const [fedFunds, us2y, spread] = await Promise.all([
      fetchFredSeries('FEDFUNDS', key, start),
      fetchFredSeries('DGS2', key, start),
      fetchFredSeries('T10Y2Y', key, start),
    ]);

    return {
      fetchedAt: new Date().toISOString(),
      available: true,
      fedFunds,
      us2y,
      spread,
    };
  });
}
