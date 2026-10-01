import 'server-only';

import { cached } from '@/lib/cache';
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
  // 키 부재는 데이터가 아니라 설정 상태다. cached() 안에서 돌려주면 그 응답이 TTL(하루)만큼
  // 캐시에 남아, 키를 넣고 배포해도 최대 하루 동안 안내 문구가 그대로 나온다.
  // 그래서 키 검사는 cached() 바깥에서 하고 이 응답은 캐시에 넣지 않는다.
  const key = process.env.FRED_API_KEY;
  if (!key) return { fetchedAt: new Date().toISOString(), available: false };

  return cached('fred', async () => {
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
