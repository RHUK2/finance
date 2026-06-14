import { NextResponse } from "next/server";

export const revalidate = 86400;

export async function GET() {
  try {
    const res = await fetch(
      "https://community-api.coinmetrics.io/v4/timeseries/asset-metrics?assets=btc&metrics=CapMVRVCur&frequency=1d&page_size=2000&start_time=2015-01-01",
      { next: { revalidate: 86400 } },
    );

    if (!res.ok) throw new Error(`CoinMetrics error: ${res.status}`);

    const data = await res.json();
    const rows: { time: string; CapMVRVCur: string }[] = data.data ?? [];

    if (rows.length === 0) throw new Error("No MVRV data");

    const history = rows.map((row) => ({
      time: row.time.slice(0, 10),
      value: Number(row.CapMVRVCur),
    }));

    const latest = history[history.length - 1];

    return NextResponse.json({
      value: latest.value,
      date: latest.time,
      history,
    });
  } catch (error) {
    console.error("mvrv fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch MVRV data" },
      { status: 500 },
    );
  }
}
