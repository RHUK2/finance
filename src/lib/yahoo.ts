import YahooFinance from 'yahoo-finance2';

import { toMacroSeries, type MacroSeries } from './series';

export const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

/**
 * 심볼 목록의 최근 `years`년 일봉 종가를 받아 key → MacroSeries 매핑으로 반환.
 *
 * 심볼 하나가 실패하면 Promise.all이 전체를 reject해 호출한 라우트가 통째로 500이 된다.
 * 네 라우트가 이 함수를 쓰므로, 상장폐지·티커 변경된 심볼이 하나 섞이면 나머지가
 * 멀쩡해도 화면이 전부 빈다. 심볼을 더할 때 그 티커가 아직 살아 있는지 먼저 확인한다.
 * 같은 함정과 그 이유는 src/lib/fred.ts에 더 적어 두었다.
 *
 * 간격은 일봉으로 고정한다. 주봉으로 내리면 `toMacroSeries`가 마지막 두 점으로 내는
 * `changePercent`가 전일 대비에서 전주 대비로 바뀌어, 카드 같은 자리의 같은 숫자가
 * 페이지마다 다른 뜻을 갖는다. 기간을 늘리고 싶으면 간격이 아니라 `years`를 키운다.
 *
 * 기본값 2년은 거시·원자재 기준이다. 개별 종목은 호출부에서 더 길게 잡는다
 * (`stocks` 5년, `strategy` 7년. 각 라우트에 이유를 적어 두었다).
 */
export async function fetchYahooSeries(
  symbols: readonly { key: string; symbol: string }[],
  { years = 2 }: { years?: number } = {},
): Promise<Record<string, MacroSeries>> {
  const period1 = new Date(Date.now() - years * 365 * 86_400_000).toISOString().slice(0, 10);

  const entries = await Promise.all(
    symbols.map(async ({ key, symbol }) => {
      const res = await yf.chart(symbol, { period1, interval: '1d' });
      const history = res.quotes
        .filter((q) => q.close != null)
        .map((q) => ({
          time: q.date.toISOString().slice(0, 10),
          value: Number((q.close as number).toFixed(2)),
        }));
      return [key, toMacroSeries(history)] as const;
    }),
  );

  return Object.fromEntries(entries);
}
