import { NextResponse } from 'next/server';

import { cached } from '@/lib/cache';
import { fetchFredSeries } from '@/lib/fred';

export const dynamic = 'force-dynamic';

// 자산(WILL5000) 시작점에 맞춰 공통 관측 시작연도를 통일.
const OBSERVATION_START = '1971-01-01';

export async function GET() {
  try {
    const data = await cached('inflation-data', async () => {
      const key = process.env.FRED_API_KEY;
      if (!key) {
        return { fetchedAt: new Date().toISOString(), available: false };
      }

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
