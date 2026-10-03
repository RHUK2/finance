import 'server-only';

import { cached } from '@/lib/cache';
import type { MacroSeries } from '@/lib/series';
import { fetchYahooSeries } from '@/lib/yahoo';

// 비트코인 차트 페이지가 BTC 옆에 세워 두는 두 종목이다. 둘 다 스트래티지가 발행한
// 증권이라 일반 주식(`stocks`)과 키를 갈랐다. BTC 가격은 여기 없다. 같은 화면의
// 나머지 차트가 쓰는 `bitcoin-historical`에서 온다. 한 화면에 BTC 출처를 둘 두면
// 같은 이름의 두 숫자가 서로 다른 값을 가리킨다.
export const SYMBOLS = [
  { key: 'mstr', symbol: 'MSTR' },
  { key: 'strc', symbol: 'STRC' },
] as const;

// 응답 모양. 훅(src/hooks/)이 `import type`으로 받아 `SYMBOLS`의 키가 곧 화면이 읽는 필드가 된다.
// 타입만 가져가므로 yahoo-finance2가 클라이언트 번들에 끌려가지 않는다.
export type StrategyData = { fetchedAt: string } & Record<(typeof SYMBOLS)[number]['key'], MacroSeries>;

// 2020-08-01부터. 스트래티지가 비트코인을 사기 시작한 2020년 8월이 화면 안에 들어와야 한다.
// 이 두 종목을 BTC 옆에 세우는 이유가 매입 전후의 대비라서 그 시작점이 잘리면 안 된다.
// 최근 N년으로 세면 시작점이 해마다 밀려 언젠가 매입 시작이 창 밖으로 나가므로 날짜로 고정한다.
// 종목이 둘뿐이라 기간이 늘어도 응답이 무겁지 않다.
const START = '2020-08-01';

export const loadStrategy = () =>
  cached('strategy', async (): Promise<StrategyData> => ({
    fetchedAt: new Date().toISOString(),
    ...(await fetchYahooSeries(SYMBOLS, { start: START })),
  }));
