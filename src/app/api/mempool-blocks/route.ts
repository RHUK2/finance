import { NextResponse } from "next/server";

export const revalidate = 60;

type MempoolBlock = {
  blockVSize: number;
  nTx: number;
  medianFee: number;
  feeRange: number[];
};

export async function GET() {
  try {
    const res = await fetch(
      "https://mempool.space/api/v1/fees/mempool-blocks",
      { next: { revalidate: 60 } },
    );
    if (!res.ok) throw new Error(`mempool blocks error: ${res.status}`);

    const data = (await res.json()) as MempoolBlock[];
    const blocks = data.map((b) => ({
      medianFee: Math.round(b.medianFee),
      feeMin: Math.round(b.feeRange[0]),
      feeMax: Math.round(b.feeRange[b.feeRange.length - 1]),
      nTx: b.nTx,
      // vMB: 가상 크기 기준 블록 점유율 (1 블록 ≈ 1 vMB)
      vMB: Number((b.blockVSize / 1_000_000).toFixed(2)),
    }));

    return NextResponse.json({ fetchedAt: new Date().toISOString(), blocks });
  } catch (error) {
    console.error("mempool-blocks fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch mempool blocks" },
      { status: 500 },
    );
  }
}
