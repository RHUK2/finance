import { NextResponse } from 'next/server';

import { cached } from '@/lib/cache';

export const dynamic = 'force-dynamic';

type Block = {
  height: number;
  timestamp: number;
  tx_count: number;
  size: number;
  weight: number;
  extras: {
    reward: number;
    medianFee: number;
    pool: { name: string; slug: string };
  };
};

export async function GET() {
  try {
    const data = await cached('recent-blocks', async () => {
      const res = await fetch('https://mempool.space/api/v1/blocks', {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`recent blocks error: ${res.status}`);

      const blocks = ((await res.json()) as Block[]).slice(0, 10).map((b) => ({
        height: b.height,
        timestamp: b.timestamp,
        poolName: b.extras.pool.name,
        poolSlug: b.extras.pool.slug,
        txCount: b.tx_count,
        sizeMB: Number((b.size / 1_000_000).toFixed(2)),
        // 블록 한도는 실제 크기가 아니라 weight(4M WU = 1 MvB) 기준이다. 충전율 계산에 쓴다.
        vMB: Number((b.weight / 4 / 1_000_000).toFixed(3)),
        rewardBTC: Number((b.extras.reward / 1e8).toFixed(3)),
        medianFee: Math.round(b.extras.medianFee),
      }));

      return { fetchedAt: new Date().toISOString(), blocks };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('recent-blocks fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch recent blocks' }, { status: 500 });
  }
}
