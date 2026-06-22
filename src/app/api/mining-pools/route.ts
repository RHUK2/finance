import { NextResponse } from "next/server";

export const revalidate = 86400;

type Pool = { name: string; slug: string; blockCount: number };

export async function GET() {
  try {
    const res = await fetch("https://mempool.space/api/v1/mining/pools/1w", {
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error(`mining pools error: ${res.status}`);

    const data = await res.json();
    const total = data.blockCount as number;
    const all = data.pools as Pool[];

    // 상위 7개 + 나머지를 "기타"로 합산
    const TOP = 7;
    const top = all.slice(0, TOP).map((p) => ({
      name: p.name,
      slug: p.slug,
      blockCount: p.blockCount,
      sharePct: Number(((p.blockCount / total) * 100).toFixed(1)),
    }));
    const restBlocks = all
      .slice(TOP)
      .reduce((sum, p) => sum + p.blockCount, 0);
    const pools =
      restBlocks > 0
        ? [
            ...top,
            {
              name: "기타",
              slug: "others",
              blockCount: restBlocks,
              sharePct: Number(((restBlocks / total) * 100).toFixed(1)),
            },
          ]
        : top;

    return NextResponse.json({
      fetchedAt: new Date().toISOString(),
      totalBlocks: total,
      pools,
    });
  } catch (error) {
    console.error("mining-pools fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch mining pools" },
      { status: 500 },
    );
  }
}
