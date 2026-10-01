import 'server-only';

import { BLOCKS_PER_HALVING, INITIAL_SUBSIDY_BTC, TARGET_BLOCK_MINUTES } from '@/lib/bitcoin-models';
import { cached } from '@/lib/cache';
import { pctChange } from '@/lib/utils';

export type MiningStatsData = {
  fetchedAt: string;
  hashrateEHs: number;
  hashrateChangePct: number;
  blockRewardBTC: number;
  difficultyChangePct: number;
  remainingBlocks: number;
  estimatedRetargetDate: string;
  remainingHalvingBlocks: number;
  estimatedHalvingDate: string;
  nextRewardBTC: number;
};

async function fetchMiningStats(): Promise<MiningStatsData> {
  const [hashrateRes, difficultyRes, blockHeightRes] = await Promise.all([
    fetch('https://mempool.space/api/v1/mining/hashrate/1w', {
      cache: 'no-store',
    }),
    fetch('https://mempool.space/api/v1/difficulty-adjustment', {
      cache: 'no-store',
    }),
    fetch('https://mempool.space/api/blocks/tip/height', {
      cache: 'no-store',
    }),
  ]);

  if (!hashrateRes.ok) throw new Error(`hashrate error: ${hashrateRes.status}`);
  if (!difficultyRes.ok) throw new Error(`difficulty error: ${difficultyRes.status}`);
  if (!blockHeightRes.ok) throw new Error(`block height error: ${blockHeightRes.status}`);

  const hashrateData = await hashrateRes.json();
  const difficulty = await difficultyRes.json();
  const blockHeight = (await blockHeightRes.json()) as number;

  const hashrates = hashrateData.hashrates as { avgHashrate: number }[];
  const latestHashrate = hashrates[hashrates.length - 1]?.avgHashrate ?? 0;
  const oldestHashrate = hashrates[0]?.avgHashrate ?? latestHashrate;
  const hashrateEHs = Number((latestHashrate / 1e18).toFixed(2));
  const hashrateChangePct = pctChange(latestHashrate, oldestHashrate);

  const epoch = Math.floor(blockHeight / BLOCKS_PER_HALVING);
  const blockRewardBTC = INITIAL_SUBSIDY_BTC / Math.pow(2, epoch);
  const remainingHalvingBlocks = (epoch + 1) * BLOCKS_PER_HALVING - blockHeight;

  const timeAvgMs = (difficulty.timeAvg as number) || TARGET_BLOCK_MINUTES * 60_000;
  const estimatedHalvingDate = new Date(Date.now() + remainingHalvingBlocks * timeAvgMs).toISOString().slice(0, 10);

  const estimatedRetargetDate = new Date(difficulty.estimatedRetargetDate as number).toISOString().slice(0, 10);

  return {
    fetchedAt: new Date().toISOString(),
    hashrateEHs,
    hashrateChangePct,
    blockRewardBTC,
    difficultyChangePct: Number((difficulty.difficultyChange as number).toFixed(2)),
    remainingBlocks: difficulty.remainingBlocks as number,
    estimatedRetargetDate,
    remainingHalvingBlocks,
    estimatedHalvingDate,
    nextRewardBTC: blockRewardBTC / 2,
  };
}

export const loadMiningStats = () => cached('mining-stats', fetchMiningStats);
