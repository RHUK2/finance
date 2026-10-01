import 'server-only';

import { cached } from '@/lib/cache';

type MempoolBlock = {
  blockVSize: number;
  nTx: number;
  medianFee: number;
  feeRange: number[];
};

export type MempoolBlocksData = {
  fetchedAt: string;
  blocks: {
    medianFee: number;
    feeMin: number;
    feeMax: number;
    nTx: number;
    vMB: number;
  }[];
};

async function fetchMempoolBlocks(): Promise<MempoolBlocksData> {
  const res = await fetch('https://mempool.space/api/v1/fees/mempool-blocks', { cache: 'no-store' });
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
}

export const loadMempoolBlocks = () => cached('mempool-blocks', fetchMempoolBlocks);
