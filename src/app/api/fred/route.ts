import { NextResponse } from "next/server";

import { cached } from "@/lib/cache";
import { fetchFredSeries } from "@/lib/fred";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await cached("fred", async () => {
      const key = process.env.FRED_API_KEY;
      if (!key) {
        return { fetchedAt: new Date().toISOString(), available: false };
      }

      const start = new Date(Date.now() - 10 * 365 * 86_400_000)
        .toISOString()
        .slice(0, 10);
      const [fedFunds, us2y] = await Promise.all([
        fetchFredSeries("FEDFUNDS", key, start),
        fetchFredSeries("DGS2", key, start),
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
