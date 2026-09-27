import { NextResponse } from 'next/server';

import { cached } from '@/lib/cache';
import { fetchYahooSeries } from '@/lib/yahoo';

export const dynamic = 'force-dynamic';

// 비트코인 차트 페이지가 BTC 옆에 세워 두는 두 종목이다. 둘 다 스트래티지가 발행한
// 증권이라 일반 주식(`stocks`)과 라우트를 갈랐다. BTC 가격은 여기 없다. 같은 화면의
// 나머지 차트가 쓰는 `bitcoin-historical`에서 온다. 한 화면에 BTC 출처를 둘 두면
// 같은 이름의 두 숫자가 서로 다른 값을 가리킨다.
const SYMBOLS = [
  { key: 'mstr', symbol: 'MSTR' },
  { key: 'strc', symbol: 'STRC' },
] as const;

// 7년. 스트래티지가 비트코인을 사기 시작한 2020년 8월이 화면 안에 들어와야 한다.
// 이 두 종목을 BTC 옆에 세우는 이유가 매입 전후의 대비라서, 5년(2021년 9월부터)으로
// 자르면 그 시작점이 잘린다. 종목이 둘뿐이라 기간을 늘려도 응답이 무겁지 않다.
const YEARS = 7;

export async function GET() {
  try {
    const data = await cached('strategy', async () => ({
      fetchedAt: new Date().toISOString(),
      ...(await fetchYahooSeries(SYMBOLS, { years: YEARS })),
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error('strategy fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch strategy data' }, { status: 500 });
  }
}
