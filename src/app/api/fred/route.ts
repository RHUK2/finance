import { NextResponse } from "next/server";

export const revalidate = 86400;

type Series = {
  history: { time: string; value: number }[];
  current: number | null;
  changePercent: number | null;
};

async function fetchSeries(seriesId: string, key: string): Promise<Series> {
  const start = new Date(Date.now() - 10 * 365 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: key,
    file_type: "json",
    observation_start: start,
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
    return NextResponse.json({ fetchedAt: new Date().toISOString(), available: false });
  }

  try {
    const [m2, fedFunds] = await Promise.all([
      fetchSeries("M2SL", key),
      fetchSeries("FEDFUNDS", key),
    ]);

    return NextResponse.json({
      fetchedAt: new Date().toISOString(),
      available: true,
      m2,
      fedFunds,
    });
  } catch (error) {
    console.error("fred fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch FRED data" },
      { status: 500 },
    );
  }
}
