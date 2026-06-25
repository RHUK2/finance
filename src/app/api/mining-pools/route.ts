import { NextResponse } from "next/server";

import { cached } from "@/lib/cache";

export const dynamic = "force-dynamic";

type Pool = { name: string; slug: string; blockCount: number };

export async function GET() {
  try {
    const data = await cached("mining-pools", async () => {
      const res = await fetch("https://mempool.space/api/v1/mining/pools/1w", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`mining pools error: ${res.status}`);

      const json = await res.json();
      const total = json.blockCount as number;
      const all = json.pools as Pool[];

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

      return {
        fetchedAt: new Date().toISOString(),
        totalBlocks: total,
        pools,
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("mining-pools fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch mining pools" },
      { status: 500 },
    );
  }
}
