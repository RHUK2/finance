import 'server-only';

import { cached } from '@/lib/cache';

type Pool = { name: string; slug: string; blockCount: number };

export type MiningPoolsData = {
  fetchedAt: string;
  totalBlocks: number;
  pools: { name: string; slug: string; sharePct: number }[];
};

// 상위 3개 + 나머지를 "기타"로 합산해 조각이 넷을 넘지 않게 한다. 화면의 누적막대가 계열색
// 넷(series-1~4)으로 조각과 범례를 잇기 때문이다. 조각이 더 많으면 색이 되풀이돼 범례로
// 조각을 찾을 수 없다.
const TOP = 3;

async function fetchMiningPools(): Promise<MiningPoolsData> {
  const res = await fetch('https://mempool.space/api/v1/mining/pools/1w', {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`mining pools error: ${res.status}`);

  const json = await res.json();
  const total = json.blockCount as number;
  const all = json.pools as Pool[];

  const share = (blocks: number) => Number(((blocks / total) * 100).toFixed(1));
  const top = all.slice(0, TOP).map((p) => ({ name: p.name, slug: p.slug, sharePct: share(p.blockCount) }));
  const restBlocks = all.slice(TOP).reduce((sum, p) => sum + p.blockCount, 0);
  const pools = restBlocks > 0 ? [...top, { name: '기타', slug: 'others', sharePct: share(restBlocks) }] : top;

  return {
    fetchedAt: new Date().toISOString(),
    totalBlocks: total,
    pools,
  };
}

export const loadMiningPools = () => cached('mining-pools', fetchMiningPools);
