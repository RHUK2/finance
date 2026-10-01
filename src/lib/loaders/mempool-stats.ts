import 'server-only';

import { cached } from '@/lib/cache';

export type MempoolStatsData = {
  fetchedAt: string;
  pendingTxCount: number;
  mempoolVMB: number; // 대기 물량의 가상 크기 합(vsize ÷ 10⁶)
  fastFee: number;
  halfHourFee: number;
  hourFee: number;
};

async function fetchMempoolStats(): Promise<MempoolStatsData> {
  const [feesRes, mempoolRes] = await Promise.all([
    fetch('https://mempool.space/api/v1/fees/recommended', {
      cache: 'no-store',
    }),
    fetch('https://mempool.space/api/mempool', {
      cache: 'no-store',
    }),
  ]);

  if (!feesRes.ok) throw new Error(`mempool fees error: ${feesRes.status}`);
  if (!mempoolRes.ok) throw new Error(`mempool stats error: ${mempoolRes.status}`);

  const fees = await feesRes.json();
  const mempool = await mempoolRes.json();

  return {
    fetchedAt: new Date().toISOString(),
    pendingTxCount: mempool.count as number,
    // 가상 크기(vsize)다. 실제 직렬화 크기가 아니므로 MB가 아니라 vMB로 부른다.
    mempoolVMB: Number(((mempool.vsize as number) / 1_000_000).toFixed(2)),
    fastFee: fees.fastestFee as number,
    halfHourFee: fees.halfHourFee as number,
    hourFee: fees.hourFee as number,
  };
}

export const loadMempoolStats = () => cached('mempool-stats', fetchMempoolStats);
