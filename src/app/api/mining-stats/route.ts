import { cached } from "@/lib/cache";
import { pctChange } from "@/lib/utils";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await cached("mining-stats", async () => {
      const [hashrateRes, difficultyRes, blockHeightRes] = await Promise.all([
        fetch("https://mempool.space/api/v1/mining/hashrate/1w", {
          cache: "no-store",
        }),
        fetch("https://mempool.space/api/v1/difficulty-adjustment", {
          cache: "no-store",
        }),
        fetch("https://mempool.space/api/blocks/tip/height", {
          cache: "no-store",
        }),
      ]);

      if (!hashrateRes.ok)
        throw new Error(`hashrate error: ${hashrateRes.status}`);
      if (!difficultyRes.ok)
        throw new Error(`difficulty error: ${difficultyRes.status}`);
      if (!blockHeightRes.ok)
        throw new Error(`block height error: ${blockHeightRes.status}`);

      const hashrateData = await hashrateRes.json();
      const difficulty = await difficultyRes.json();
      const blockHeight = (await blockHeightRes.json()) as number;

      const hashrates = hashrateData.hashrates as { avgHashrate: number }[];
      const latestHashrate = hashrates[hashrates.length - 1]?.avgHashrate ?? 0;
      const oldestHashrate = hashrates[0]?.avgHashrate ?? latestHashrate;
      const hashrateEHs = Number((latestHashrate / 1e18).toFixed(2));
      const hashrateChangePct = pctChange(latestHashrate, oldestHashrate);

      const epoch = Math.floor(blockHeight / 210_000);
      const blockRewardBTC = 50 / Math.pow(2, epoch);
      const nextHalvingBlock = (epoch + 1) * 210_000;
      const remainingHalvingBlocks = nextHalvingBlock - blockHeight;

      const timeAvgMs = (difficulty.timeAvg as number) || 600_000;
      const estimatedHalvingDate = new Date(
        Date.now() + remainingHalvingBlocks * timeAvgMs,
      )
        .toISOString()
        .slice(0, 10);

      const estimatedRetargetDate = new Date(
        difficulty.estimatedRetargetDate as number,
      )
        .toISOString()
        .slice(0, 10);

      return {
        fetchedAt: new Date().toISOString(),
        hashrateEHs,
        hashrateChangePct,
        blockHeight,
        blockRewardBTC,
        difficultyChangePct: Number(
          (difficulty.difficultyChange as number).toFixed(2),
        ),
        previousDifficultyChangePct: Number(
          (difficulty.previousRetarget as number).toFixed(2),
        ),
        remainingBlocks: difficulty.remainingBlocks as number,
        estimatedRetargetDate,
        nextHalvingBlock,
        remainingHalvingBlocks,
        estimatedHalvingDate,
        nextRewardBTC: blockRewardBTC / 2,
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("mining-stats fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch mining stats" },
      { status: 500 },
    );
  }
}
