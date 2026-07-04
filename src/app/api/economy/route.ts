import { NextResponse } from "next/server";

import { cached } from "@/lib/cache";
import { fetchYahooSeries } from "@/lib/yahoo";

export const dynamic = "force-dynamic";

const SYMBOLS = [
  { key: "dxy", symbol: "DX-Y.NYB" },
  { key: "us10y", symbol: "^TNX" },
  { key: "us30y", symbol: "^TYX" },
  { key: "vix", symbol: "^VIX" },
  { key: "nasdaq", symbol: "^IXIC" },
  { key: "kospi", symbol: "^KS11" },
  { key: "usdkrw", symbol: "USDKRW=X" },
] as const;

export async function GET() {
  try {
    const data = await cached("economy", async () => ({
      fetchedAt: new Date().toISOString(),
      ...(await fetchYahooSeries(SYMBOLS)),
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("economy fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch economy data" },
      { status: 500 },
    );
  }
}
