import 'server-only';

import YahooFinance from 'yahoo-finance2';

import { toMacroSeries, type MacroSeries } from './series';

export const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// 부분 통화 단위로 호가되는 심볼이 있다. CBOT 옥수수(`ZC=F`)는 부셸당 센트라 야후가
// `meta.currency: 'USX'`로 주고 값도 센트 그대로다. 달러로 맞춰 두지 않으면 화면의 `$`
// 표기가 100배 커진다. 통화 코드로 가르므로 야후가 나중에 달러로 정규화해 줘도 결과가 같다.
const SUBUNIT_SCALE: Record<string, number> = { USX: 0.01 };

/**
 * 일봉 타임스탬프를 날짜(YYYY-MM-DD)로 바꾼다. 야후는 일봉에 거래소 현지 자정이나 개장 시각을 찍는다.
 * UTC보다 동쪽인 거래소(서머타임 중인 런던의 `USDKRW=X`, 서울)는 현지 자정이 UTC로 전날이라
 * UTC로 자르면 하루 당겨진다. 서쪽(뉴욕·시카고)은 현지 자정·개장이 UTC로 같은 날이지만,
 * 선물의 마지막 진행 중 봉은 저녁 세션(다음 거래일)이라 현지 날짜로 자르면 전날 봉과 겹친다.
 * 그래서 현지 날짜와 UTC 날짜 중 늦은 쪽을 쓴다. 동쪽에서는 현지, 서쪽에서는 UTC가 된다.
 */
export function barDate(date: Date, timeZone: string): string {
  const utc = date.toISOString().slice(0, 10);
  // en-CA는 YYYY-MM-DD로 찍는다.
  const local = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  return local > utc ? local : utc;
}

/**
 * 심볼 목록의 일봉 종가를 받아 key → MacroSeries 매핑으로 반환. 기간은 최근 `years`년이거나
 * 고정 시작일 `start`(YYYY-MM-DD)부터 오늘까지다.
 * 부분 통화 단위(센트) 호가는 주 통화 단위(달러)로 바꿔 돌려준다(`SUBUNIT_SCALE`).
 *
 * 심볼 하나가 실패하면 Promise.all이 전체를 reject한다. 네 로더가 이 함수를 쓰므로,
 * 상장폐지·티커 변경된 심볼이 하나 섞이면 나머지가 멀쩡해도 그 키가 갱신되지 않는다.
 * 캐시에 값이 없으면 500이고, 있으면 마지막 성공 값을 계속 내보내 갱신시각만 늘어난다
 * (src/lib/cache.ts). 빈 시계열도 같은 실패로 본다. 심볼을 더할 때 그 티커가 아직 살아 있는지
 * 먼저 확인한다. 같은 함정과 그 이유는 src/lib/fred.ts에 더 적어 두었다.
 *
 * 간격은 일봉으로 고정한다. 주봉으로 내리면 `toMacroSeries`가 마지막 두 점으로 내는
 * `changePercent`가 전일 대비에서 전주 대비로 바뀌어, 카드 같은 자리의 같은 숫자가
 * 페이지마다 다른 뜻을 갖는다. 기간을 늘리고 싶으면 간격이 아니라 기간 인자를 바꾼다.
 *
 * 기본값 최근 2년은 거시·원자재 기준이다. 개별 종목은 화면에 담아야 할 사건이 날짜로 정해져 있어
 * 고정 시작일을 넘긴다(`stocks` 2020-01-01, `strategy` 2020-08-01. 각 로더에 이유를 적어 두었다).
 */
export async function fetchYahooSeries<K extends string>(
  symbols: readonly { key: K; symbol: string }[],
  span: { years: number } | { start: string } = { years: 2 },
): Promise<Record<K, MacroSeries>> {
  const period1 =
    'start' in span ? span.start : new Date(Date.now() - span.years * 365 * 86_400_000).toISOString().slice(0, 10);

  const entries = await Promise.all(
    symbols.map(async ({ key, symbol }) => {
      const res = await yf.chart(symbol, { period1, interval: '1d' });
      const scale = SUBUNIT_SCALE[res.meta.currency] ?? 1;
      // 센트를 달러로 바꾼 값은 둘째 자리에서 자르면 원래 호가의 자릿수를 잃는다.
      const digits = scale === 1 ? 2 : 4;
      const history = res.quotes
        .filter((q) => q.close != null)
        .map((q) => ({
          time: barDate(q.date, res.meta.exchangeTimezoneName),
          value: Number(((q.close as number) * scale).toFixed(digits)),
        }));
      if (history.length === 0) throw new Error(`Yahoo ${symbol}: 빈 시계열`);
      return [key, toMacroSeries(history)] as const;
    }),
  );

  return Object.fromEntries(entries) as Record<K, MacroSeries>;
}
