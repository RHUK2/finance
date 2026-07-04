import { NextResponse } from "next/server";

import { cached } from "@/lib/cache";
import { mvrvZScore } from "@/lib/bitcoin-models";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await cached("mvrv", async () => {
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
          { cache: "no-store" },
        );
        if (!res.ok) throw new Error(`CoinMetrics error: ${res.status}`);

        const json = await res.json();
        rows.push(...((json.data as Row[]) ?? []));
        nextPageToken = (json.next_page_token as string) ?? null;
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

      const history = merged.map((row) => ({
        time: row.time,
        value: row.mvrv,
      }));

      const zScore = mvrvZScore(merged);

      const latest = history[history.length - 1];

      return {
        fetchedAt: new Date().toISOString(),
        value: latest.value,
        date: latest.time,
        history,
        zScore,
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("mvrv fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch MVRV data" },
      { status: 500 },
    );
  }
}
