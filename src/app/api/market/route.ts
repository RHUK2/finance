import { NextResponse } from 'next/server';

import { cached } from '@/lib/cache';
import { yf } from '@/lib/yahoo';

export const dynamic = 'force-dynamic';

// 자산 테이블이 사라지면서 남은 소비자는 `/bitcoin-volatility`의 두 갈래 운명 탭 하나다.
// 그 탭은 일간 종가가 아니라 실시간 시세를 써야 해서(종가는 하루 늦다) 300초 TTL의
// 이 라우트가 따로 남아 있다. 가격 시계열이 필요한 화면은 `stocks`·`strategy`를 쓴다.
const SYMBOLS = [{ symbol: 'BTC-USD' }] as const;

export async function GET() {
  try {
    const data = await cached('market', async () => {
      const quotes = (await yf.quote(
        SYMBOLS.map((s) => s.symbol),
        { return: 'object' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as Record<string, any>;

      const results = SYMBOLS.map(({ symbol }) => {
        const quote = quotes[symbol] ?? {};
        return {
          symbol,
          price: quote.regularMarketPrice ?? null,
          change: quote.regularMarketChange ?? null,
          changePercent: quote.regularMarketChangePercent ?? null,
          currency: quote.currency ?? 'USD',
        };
      });

      return { fetchedAt: new Date().toISOString(), items: results };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('market fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
  }
}
