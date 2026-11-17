import 'server-only';

import { fetchJson } from '@/lib/fetch-json';
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
  // 거래가 없는 멤풀은 빈 목록이 정상이다. 시계열과 달리 U3의 0 물량 규칙을 유지한다.
  const rows = await fetchJson<MempoolBlock[]>('https://mempool.space/api/v1/fees/mempool-blocks', 'mempool blocks', {
    allowEmptyArray: true,
  });
  if (
    !Array.isArray(rows) ||
    rows.some(
      (b) =>
        !Array.isArray(b.feeRange) ||
        b.feeRange.length === 0 ||
        [b.medianFee, b.nTx, b.blockVSize, ...b.feeRange].some((value) => !Number.isFinite(value) || value < 0),
    )
  ) {
    throw new Error('mempool blocks: 잘못된 블록 수치');
  }
  const blocks = rows.map((b) => ({
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
