import { NextResponse } from "next/server";

import { cached } from "@/lib/cache";

export const dynamic = "force-dynamic";

type MempoolBlock = {
  blockVSize: number;
  nTx: number;
  medianFee: number;
  feeRange: number[];
};

export async function GET() {
  try {
    const data = await cached("mempool-blocks", async () => {
      const res = await fetch(
        "https://mempool.space/api/v1/fees/mempool-blocks",
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error(`mempool blocks error: ${res.status}`);

      const blocks = ((await res.json()) as MempoolBlock[]).map((b) => ({
        medianFee: Math.round(b.medianFee),
        feeMin: Math.round(b.feeRange[0]),
        feeMax: Math.round(b.feeRange[b.feeRange.length - 1]),
        nTx: b.nTx,
        // vMB: 가상 크기 기준 블록 점유율 (1 블록 ≈ 1 vMB)
        vMB: Number((b.blockVSize / 1_000_000).toFixed(2)),
      }));

      return { fetchedAt: new Date().toISOString(), blocks };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("mempool-blocks fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch mempool blocks" },
      { status: 500 },
    );
  }
}
