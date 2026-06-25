import { NextResponse } from "next/server";

import { cached } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await cached("mempool-stats", async () => {
      const [feesRes, mempoolRes] = await Promise.all([
        fetch("https://mempool.space/api/v1/fees/recommended", {
          cache: "no-store",
        }),
        fetch("https://mempool.space/api/mempool", {
          cache: "no-store",
        }),
      ]);

      if (!feesRes.ok) throw new Error(`mempool fees error: ${feesRes.status}`);
      if (!mempoolRes.ok)
        throw new Error(`mempool stats error: ${mempoolRes.status}`);

      const fees = await feesRes.json();
      const mempool = await mempoolRes.json();

      return {
        fetchedAt: new Date().toISOString(),
        pendingTxCount: mempool.count as number,
        mempoolSizeMB: Number(
          ((mempool.vsize as number) / 1_000_000).toFixed(2),
        ),
        fastFee: fees.fastestFee as number,
        halfHourFee: fees.halfHourFee as number,
        hourFee: fees.hourFee as number,
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("mempool-stats fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch mempool stats" },
      { status: 500 },
    );
  }
}
