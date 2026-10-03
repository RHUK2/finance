import 'server-only';

import { cached } from '@/lib/cache';
import type { MacroSeries } from '@/lib/series';
import { fetchYahooSeries } from '@/lib/yahoo';

// 스트래티지(MSTR)와 그 우선주(STRC)는 여기가 아니라 `strategy`에 있다.
// 비트코인 차트 페이지만 쓰는 값이라, 주식 페이지 하나 열자고 같이 내려보내지 않는다.
export const SYMBOLS = [
  { key: 'tsla', symbol: 'TSLA' },
  { key: 'nvda', symbol: 'NVDA' },
  { key: 'tsm', symbol: 'TSM' },
  { key: 'samsung', symbol: '005930.KS' },
  { key: 'hynix', symbol: '000660.KS' },
  { key: 'googl', symbol: 'GOOGL' },
  { key: 'msft', symbol: 'MSFT' },
  { key: 'aapl', symbol: 'AAPL' },
  { key: 'meta', symbol: 'META' },
  { key: 'amzn', symbol: 'AMZN' },
  { key: 'nke', symbol: 'NKE' },
  { key: 'spcx', symbol: 'SPCX' },
] as const;

// 응답 모양. 훅(src/hooks/)이 `import type`으로 받아 `SYMBOLS`의 키가 곧 화면이 읽는 필드가 된다.
// 타입만 가져가므로 yahoo-finance2가 클라이언트 번들에 끌려가지 않는다.
export type StocksData = { fetchedAt: string } & Record<(typeof SYMBOLS)[number]['key'], MacroSeries>;

// 2020-01-01부터. 2020년 3월 급락, 2022년 하락장, 그 뒤 AI 랠리가 한 화면에 들어와야 한다.
// 최근 N년으로 세면 시작점이 해마다 밀려 2020년 3월이 창 밖으로 나가므로 날짜로 고정한다.
// 더 앞으로 당기지 않는 것은 종목마다 야후 일봉이 시작되는 해가 제각각이라(애플 1980, 삼성전자 2000,
// SPCX 2026) 전체 기간으로 가면 열두 차트의 x축 기준이 서로 맞지 않고, 12종목 전체 일봉이 한 응답에
// 2~3MB로 실리기 때문이다. 고정 시작일이라 응답은 해마다 종목당 약 250점씩 자란다.
const START = '2020-01-01';

export const loadStocks = () =>
  cached('stocks', async (): Promise<StocksData> => ({
    fetchedAt: new Date().toISOString(),
    ...(await fetchYahooSeries(SYMBOLS, { start: START })),
  }));
