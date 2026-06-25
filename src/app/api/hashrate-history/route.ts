import { NextResponse } from "next/server";

import { cached } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await cached("hashrate-history", async () => {
      const res = await fetch(
        "https://mempool.space/api/v1/mining/hashrate/1y",
        {
          cache: "no-store",
        },
      );
      if (!res.ok) throw new Error(`hashrate history error: ${res.status}`);

      const json = await res.json();
      const hashrates = json.hashrates as {
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

      return {
        fetchedAt: new Date().toISOString(),
        history,
        currentHashrateEHs: Number((json.currentHashrate / 1e18).toFixed(2)),
        currentDifficultyT: Number((json.currentDifficulty / 1e12).toFixed(2)),
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("hashrate-history fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch hashrate history" },
      { status: 500 },
    );
  }
}
