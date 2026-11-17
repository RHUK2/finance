import 'server-only';

import { BLOCKS_PER_HALVING, subsidyAtEra, TARGET_BLOCK_MINUTES } from '@/lib/bitcoin-models';
import { fetchJson } from '@/lib/fetch-json';
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
  const [hashrateData, difficulty, blockHeight] = await Promise.all([
    fetchJson<{ hashrates: { avgHashrate: number }[] }>('https://mempool.space/api/v1/mining/hashrate/1w', 'hashrate'),
    fetchJson<Record<string, number>>('https://mempool.space/api/v1/difficulty-adjustment', 'difficulty'),
    fetchJson<number>('https://mempool.space/api/blocks/tip/height', 'block height'),
  ]);

  const hashrates = hashrateData.hashrates as { avgHashrate: number }[];
  if (
    !Array.isArray(hashrates) ||
    hashrates.length === 0 ||
    hashrates.some((h) => !Number.isFinite(h.avgHashrate) || h.avgHashrate <= 0) ||
    !Number.isInteger(blockHeight) ||
    blockHeight < 0 ||
    !Number.isFinite(difficulty.difficultyChange) ||
    !Number.isFinite(difficulty.remainingBlocks) ||
    difficulty.remainingBlocks < 0 ||
    !Number.isFinite(difficulty.estimatedRetargetDate)
  ) {
    throw new Error('mining stats: 잘못된 채굴 수치');
  }
  const latestHashrate = hashrates[hashrates.length - 1].avgHashrate;
  const oldestHashrate = hashrates[0].avgHashrate;
  const hashrateEHs = Number((latestHashrate / 1e18).toFixed(2));
  const hashrateChangePct = pctChange(latestHashrate, oldestHashrate);

  const epoch = Math.floor(blockHeight / BLOCKS_PER_HALVING);
  // 보조금과 다음 반감기까지 남은 블록은 모두 실측 높이를 따른다.
  const blockRewardBTC = subsidyAtEra(epoch);
  const remainingHalvingBlocks = (epoch + 1) * BLOCKS_PER_HALVING - blockHeight;

  const timeAvgMs =
    Number.isFinite(difficulty.timeAvg) && difficulty.timeAvg > 0
      ? (difficulty.timeAvg as number)
      : TARGET_BLOCK_MINUTES * 60_000;
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
    nextRewardBTC: subsidyAtEra(epoch + 1),
  };
}

export const loadMiningStats = () => cached('mining-stats', fetchMiningStats);
