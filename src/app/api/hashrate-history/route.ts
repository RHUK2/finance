import { NextResponse } from "next/server";

export const revalidate = 600;

export async function GET() {
  try {
    const res = await fetch(
      "https://mempool.space/api/v1/mining/hashrate/1y",
      { next: { revalidate: 600 } },
    );
    if (!res.ok) throw new Error(`hashrate history error: ${res.status}`);

    const data = await res.json();
    const hashrates = data.hashrates as {
      timestamp: number;
      avgHashrate: number;
    }[];

    const seen = new Set<string>();
    const history = hashrates
      .map((h) => ({
        time: new Date(h.timestamp * 1000).toISOString().slice(0, 10),
        value: Number((h.avgHashrate / 1e18).toFixed(2)),
      }))
      .filter((h) => {
        if (seen.has(h.time)) return false;
        seen.add(h.time);
        return true;
      });

    return NextResponse.json({
      fetchedAt: new Date().toISOString(),
      history,
      currentHashrateEHs: Number((data.currentHashrate / 1e18).toFixed(2)),
      currentDifficultyT: Number((data.currentDifficulty / 1e12).toFixed(2)),
    });
  } catch (error) {
    console.error("hashrate-history fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch hashrate history" },
      { status: 500 },
    );
  }
}
