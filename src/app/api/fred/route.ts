import { NextResponse } from "next/server";

import { cached } from "@/lib/cache";

export const dynamic = "force-dynamic";

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
    { cache: "no-store" },
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
  try {
    const data = await cached("fred", async () => {
      const key = process.env.FRED_API_KEY;
      if (!key) {
        return { fetchedAt: new Date().toISOString(), available: false };
      }

      const [fedFunds, us2y] = await Promise.all([
        fetchSeries("FEDFUNDS", key),
        fetchSeries("DGS2", key),
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
    console.error("fred fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch FRED data" },
      { status: 500 },
    );
  }
}
