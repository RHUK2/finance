import { NextResponse } from 'next/server';

import { cached } from '@/lib/cache';
import { fetchYahooSeries } from '@/lib/yahoo';

export const dynamic = 'force-dynamic';

// 스트래티지(MSTR)와 그 우선주(STRC)는 여기가 아니라 `strategy` 라우트에 있다.
// 비트코인 차트 페이지만 쓰는 값이라, 주식 페이지 하나 열자고 같이 내려보내지 않는다.
const SYMBOLS = [
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

// 5년. 2020년 3월 급락, 2022년 하락장, 그 뒤 AI 랠리가 한 화면에 들어오는 최소 구간이다.
// 더 늘리지 않는 것은 종목마다 상장일이 제각각이라(애플 1980, 삼성전자 2000, SPCX 2026)
// 전체 기간으로 가면 열두 차트의 x축 기준이 서로 맞지 않고, 12종목 전체 일봉이 한 응답에
// 2~3MB로 실리기 때문이다.
const YEARS = 5;

export async function GET() {
  try {
    const data = await cached('stocks', async () => ({
      fetchedAt: new Date().toISOString(),
      ...(await fetchYahooSeries(SYMBOLS, { years: YEARS })),
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error('stocks fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch stocks data' }, { status: 500 });
  }
}
