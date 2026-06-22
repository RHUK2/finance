import { NextResponse } from "next/server";

// cache-config.ts ENDPOINTS["inflation-data"]와 동기화.
export const revalidate = 86400;

// 자산(WILL5000) 시작점에 맞춰 공통 관측 시작연도를 통일.
const OBSERVATION_START = "1971-01-01";

type Series = {
  history: { time: string; value: number }[];
  current: number | null;
  changePercent: number | null;
};

async function fetchSeries(seriesId: string, key: string): Promise<Series> {
  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: key,
    file_type: "json",
    observation_start: OBSERVATION_START,
  });
  const res = await fetch(
    `https://api.stlouisfed.org/fred/series/observations?${params}`,
    { next: { revalidate: 86400 } },
  );
  if (!res.ok) throw new Error(`FRED ${seriesId} error: ${res.status}`);

  const data = await res.json();
  const history = (data.observations as { date: string; value: string }[])
    .filter((o) => o.value !== ".")
    .map((o) => ({ time: o.date, value: Number(o.value) }));

  const last = history[history.length - 1];
  const prev = history[history.length - 2];
  const changePercent =
    last && prev && prev.value !== 0
      ? Number((((last.value - prev.value) / prev.value) * 100).toFixed(2))
      : null;

  return { history, current: last?.value ?? null, changePercent };
}

export async function GET() {
  const key = process.env.FRED_API_KEY;
  if (!key) {
    return NextResponse.json({
      fetchedAt: new Date().toISOString(),
      available: false,
    });
  }

  try {
    const [cpi, m2, deposit, stock, house] = await Promise.all([
      fetchSeries("CPIAUCSL", key), // 소비자물가지수
      fetchSeries("M2SL", key), // 광의통화 (2021년 정의 변경)
      fetchSeries("TB3MS", key), // 3개월 국채금리 — 단기 예금금리 근사
      fetchSeries("NASDAQCOM", key), // NASDAQ 종합지수 (배당 제외, 1971~)
      fetchSeries("CSUSHPISA", key), // Case-Shiller 전미주택가격지수 (1987~)
    ]);

    return NextResponse.json({
      fetchedAt: new Date().toISOString(),
      available: true,
      cpi,
      m2,
      deposit,
      stock,
      house,
    });
  } catch (error) {
    console.error("inflation-data fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch inflation data" },
      { status: 500 },
    );
  }
}
