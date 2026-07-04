import { NextResponse } from "next/server";

import { cached } from "@/lib/cache";
import { fetchYahooSeries } from "@/lib/yahoo";

export const dynamic = "force-dynamic";

const SYMBOLS = [
  { key: "gold", symbol: "GC=F" },
  { key: "wti", symbol: "CL=F" },
  { key: "brent", symbol: "BZ=F" },
  { key: "corn", symbol: "ZC=F" },
] as const;

export async function GET() {
  try {
    const data = await cached("commodities", async () => ({
      fetchedAt: new Date().toISOString(),
      ...(await fetchYahooSeries(SYMBOLS)),
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("commodities fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch commodities data" },
      { status: 500 },
    );
  }
}
