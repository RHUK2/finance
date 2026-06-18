import { NextResponse } from "next/server";

export const revalidate = 60;

type Block = {
  height: number;
  timestamp: number;
  tx_count: number;
  size: number;
  extras: {
    reward: number;
    medianFee: number;
    pool: { name: string; slug: string };
  };
};

export async function GET() {
  try {
    const res = await fetch("https://mempool.space/api/v1/blocks", {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`recent blocks error: ${res.status}`);

    const data = (await res.json()) as Block[];
    const blocks = data.slice(0, 10).map((b) => ({
      height: b.height,
      timestamp: b.timestamp,
      poolName: b.extras.pool.name,
      poolSlug: b.extras.pool.slug,
      txCount: b.tx_count,
      sizeMB: Number((b.size / 1_000_000).toFixed(2)),
      rewardBTC: Number((b.extras.reward / 1e8).toFixed(3)),
      medianFee: Math.round(b.extras.medianFee),
    }));

    return NextResponse.json({ fetchedAt: new Date().toISOString(), blocks });
  } catch (error) {
    console.error("recent-blocks fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent blocks" },
      { status: 500 },
    );
  }
}
