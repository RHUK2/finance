import 'server-only';

import { cached } from '@/lib/cache';

type Block = {
  height: number;
  timestamp: number;
  tx_count: number;
  weight: number;
  extras: {
    medianFee: number;
    pool: { name: string };
  };
};

export type RecentBlocksData = {
  fetchedAt: string;
  blocks: {
    height: number;
    timestamp: number;
    poolName: string;
    txCount: number;
    vMB: number; // weight ÷ 4 (블록 한도 1 MvB 대비 충전율 계산용)
    medianFee: number;
  }[];
};

async function fetchRecentBlocks(): Promise<RecentBlocksData> {
  const res = await fetch('https://mempool.space/api/v1/blocks', {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`recent blocks error: ${res.status}`);

  const blocks = ((await res.json()) as Block[]).slice(0, 10).map((b) => ({
    height: b.height,
    timestamp: b.timestamp,
    poolName: b.extras.pool.name,
    txCount: b.tx_count,
    // 블록 한도는 실제 크기가 아니라 weight(4M WU = 1 MvB) 기준이다. 충전율 계산에 쓴다.
    vMB: Number((b.weight / 4 / 1_000_000).toFixed(3)),
    medianFee: Math.round(b.extras.medianFee),
  }));

  return { fetchedAt: new Date().toISOString(), blocks };
}

export const loadRecentBlocks = () => cached('recent-blocks', fetchRecentBlocks);
