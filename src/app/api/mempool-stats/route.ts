import { NextResponse } from "next/server";

export const revalidate = 900;

export async function GET() {
  try {
    const [feesRes, mempoolRes] = await Promise.all([
      fetch("https://mempool.space/api/v1/fees/recommended", {
        next: { revalidate: 900 },
      }),
      fetch("https://mempool.space/api/mempool", {
        next: { revalidate: 900 },
      }),
    ]);

    if (!feesRes.ok) throw new Error(`mempool fees error: ${feesRes.status}`);
    if (!mempoolRes.ok)
      throw new Error(`mempool stats error: ${mempoolRes.status}`);

    const fees = await feesRes.json();
    const mempool = await mempoolRes.json();

    return NextResponse.json({
      pendingTxCount: mempool.count as number,
      mempoolSizeMB: Number(((mempool.vsize as number) / 1_000_000).toFixed(2)),
      fastFee: fees.fastestFee as number,
      halfHourFee: fees.halfHourFee as number,
      hourFee: fees.hourFee as number,
    });
  } catch (error) {
    console.error("mempool-stats fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch mempool stats" },
      { status: 500 },
    );
  }
}
