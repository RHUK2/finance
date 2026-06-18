import { NextResponse } from "next/server";

export const revalidate = 86400;

export async function GET() {
  try {
    type Row = { time: string; CapMVRVCur: string; CapMrktCurUSD: string };
    const rows: Row[] = [];
    let nextPageToken: string | null = null;

    do {
      const params = new URLSearchParams({
        assets: "btc",
        metrics: "CapMVRVCur,CapMrktCurUSD",
        frequency: "1d",
        page_size: "2000",
        start_time: "2015-01-01",
      });
      if (nextPageToken) params.set("next_page_token", nextPageToken);

      const res = await fetch(
        `https://community-api.coinmetrics.io/v4/timeseries/asset-metrics?${params}`,
        { next: { revalidate: 86400 } },
      );
      if (!res.ok) throw new Error(`CoinMetrics error: ${res.status}`);

      const data = await res.json();
      rows.push(...((data.data as Row[]) ?? []));
      nextPageToken = (data.next_page_token as string) ?? null;
    } while (nextPageToken);

    if (rows.length === 0) throw new Error("No MVRV data");

    const seen = new Set<string>();
    const merged = rows
      .map((row) => ({
        time: row.time.slice(0, 10),
        mvrv: Number(row.CapMVRVCur),
        marketCap: Number(row.CapMrktCurUSD),
      }))
      .filter((row) => {
        if (!isFinite(row.mvrv) || seen.has(row.time)) return false;
        seen.add(row.time);
        return true;
      })
      .sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));

    const history = merged.map((row) => ({ time: row.time, value: row.mvrv }));

    // MVRV Z-Score = (시총 − 실현시총) / 시총의 표준편차 (실현시총 = 시총 / MVRV)
    // 표준편차는 확장 윈도우(시작~당일)로 계산해 미래 데이터 참조를 배제.
    // 최소 1년(365일) 표본이 쌓이기 전 불안정한 초기 구간은 제외.
    const caps = merged.filter(
      (r) => isFinite(r.marketCap) && r.marketCap > 0 && r.mvrv > 0,
    );
    const zScore: { time: string; value: number }[] = [];
    let sum = 0;
    let sumSq = 0;
    for (let i = 0; i < caps.length; i++) {
      const { marketCap, mvrv, time } = caps[i];
      sum += marketCap;
      sumSq += marketCap ** 2;
      const n = i + 1;
      const std = Math.sqrt(Math.max(sumSq / n - (sum / n) ** 2, 0));
      if (n >= 365 && std > 0) {
        zScore.push({ time, value: (marketCap - marketCap / mvrv) / std });
      }
    }

    const latest = history[history.length - 1];

    return NextResponse.json({
      fetchedAt: new Date().toISOString(),
      value: latest.value,
      date: latest.time,
      history,
      zScore,
    });
  } catch (error) {
    console.error("mvrv fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch MVRV data" },
      { status: 500 },
    );
  }
}
