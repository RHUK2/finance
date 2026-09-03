import { NextResponse } from 'next/server';

import { cached } from '@/lib/cache';
import { fetchFredSeries } from '@/lib/fred';

export const dynamic = 'force-dynamic';

// 주식(NASDAQCOM) 시계열 시작점(1971-02)에 맞춰 공통 관측 시작연도를 통일.
const OBSERVATION_START = '1971-01-01';

export async function GET() {
  try {
    // 키 부재는 데이터가 아니라 설정 상태다. cached() 안에서 돌려주면 그 응답이 TTL(하루)만큼
    // 캐시에 남아, 키를 넣고 배포해도 최대 하루 동안 안내 카드가 그대로 나온다.
    // 그래서 키 검사는 cached() 바깥에서 하고 이 응답은 캐시에 넣지 않는다.
    const key = process.env.FRED_API_KEY;
    if (!key) {
      return NextResponse.json({ fetchedAt: new Date().toISOString(), available: false });
    }

    const data = await cached('inflation-data', async () => {
      // 하나만 실패해도 Promise.all이 전체를 reject해 이 라우트가 통째로 500이 된다.
      // 폐기·개편된 시리즈가 섞이면 나머지 넷이 멀쩡해도 화면이 비므로, 시리즈를 더할 때
      // 그 시리즈가 살아 있는지 먼저 확인한다(같은 함정과 이유는 src/lib/fred.ts).
      const [cpi, m2, deposit, stock, house] = await Promise.all([
        fetchFredSeries('CPIAUCSL', key, OBSERVATION_START), // 소비자물가지수
        fetchFredSeries('M2SL', key, OBSERVATION_START), // 광의통화 (2021년 정의 변경)
        fetchFredSeries('TB3MS', key, OBSERVATION_START), // 3개월 국채금리(단기 예금금리 근사)
        fetchFredSeries('NASDAQCOM', key, OBSERVATION_START), // NASDAQ 종합지수 (배당 제외, 1971~)
        fetchFredSeries('CSUSHPISA', key, OBSERVATION_START), // Case-Shiller 전미주택가격지수 (1987~)
      ]);

      return {
        fetchedAt: new Date().toISOString(),
        available: true,
        cpi,
        m2,
        deposit,
        stock,
        house,
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('inflation-data fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch inflation data' }, { status: 500 });
  }
}
