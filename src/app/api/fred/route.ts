import { NextResponse } from 'next/server';

import { cached } from '@/lib/cache';
import { fetchFredSeries } from '@/lib/fred';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 키 부재는 데이터가 아니라 설정 상태다. cached() 안에서 돌려주면 그 응답이 TTL(하루)만큼
    // 캐시에 남아, 키를 넣고 배포해도 최대 하루 동안 안내 문구가 그대로 나온다.
    // 그래서 키 검사는 cached() 바깥에서 하고 이 응답은 캐시에 넣지 않는다.
    const key = process.env.FRED_API_KEY;
    if (!key) {
      return NextResponse.json({ fetchedAt: new Date().toISOString(), available: false });
    }

    const data = await cached('fred', async () => {
      const start = new Date(Date.now() - 10 * 365 * 86_400_000).toISOString().slice(0, 10);
      const [fedFunds, us2y] = await Promise.all([
        fetchFredSeries('FEDFUNDS', key, start),
        fetchFredSeries('DGS2', key, start),
      ]);

      return {
        fetchedAt: new Date().toISOString(),
        available: true,
        fedFunds,
        us2y,
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('fred fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch FRED data' }, { status: 500 });
  }
}
