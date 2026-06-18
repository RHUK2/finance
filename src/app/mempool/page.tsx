"use client";

import { AppHeader } from "@/components/app-header";
import { HashrateChart } from "@/components/hashrate-chart";
import { PageMain } from "@/components/page-main";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useHashrateHistory,
  useLightningStats,
  useMempoolBlocks,
  useMempoolStats,
  useMiningPools,
  useMiningStats,
  useRecentBlocks,
} from "@/hooks/use-mempool";
import { useRelativeTime } from "@/hooks/use-relative-time";
import {
  DonutRing,
  MempoolBlocksViz,
  PoolShareChart,
  RecentBlocksList,
  Section,
  Stat,
  StatSkeleton,
} from "./components";

export default function MempoolPage() {
  const { data: mempool, isLoading: mempoolLoading } = useMempoolStats();
  const { data: mining, isLoading: miningLoading } = useMiningStats();
  const { data: lightning, isLoading: lightningLoading } = useLightningStats();
  const { data: mempoolBlocks, isLoading: mempoolBlocksLoading } =
    useMempoolBlocks();
  const { data: recentBlocks, isLoading: recentBlocksLoading } =
    useRecentBlocks();
  const { data: hashrate, isLoading: hashrateLoading } = useHashrateHistory();
  const { data: pools, isLoading: poolsLoading } = useMiningPools();

  const mempoolRelTime = useRelativeTime(mempool?.fetchedAt);
  const miningRelTime = useRelativeTime(mining?.fetchedAt);
  const lightningRelTime = useRelativeTime(lightning?.fetchedAt);
  const mempoolBlocksRelTime = useRelativeTime(mempoolBlocks?.fetchedAt);
  const recentBlocksRelTime = useRelativeTime(recentBlocks?.fetchedAt);
  const hashrateRelTime = useRelativeTime(hashrate?.fetchedAt);
  const poolsRelTime = useRelativeTime(pools?.fetchedAt);

  return (
    <>
      <AppHeader breadcrumbs={[{ label: "비트코인 네트워크" }]} />
      <PageMain>
        <div className="flex flex-col gap-6">
          {/* 멤풀 */}
          <Section title="멤풀" relativeTime={mempoolRelTime}>
            {mempoolLoading || !mempool ? (
              <Card>
                <CardContent>
                  <div className="grid grid-cols-2 gap-x-6">
                    <StatSkeleton />
                    <StatSkeleton />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent>
                  <div className="grid grid-cols-2 gap-x-6">
                    <Stat
                      label="미확인 트랜잭션"
                      value={mempool.pendingTxCount.toLocaleString()}
                    />
                    <Stat
                      label="멤풀 크기"
                      value={`${mempool.mempoolSizeMB} MB`}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </Section>

          {/* 수수료 */}
          <Section title="수수료" relativeTime={mempoolRelTime}>
            {mempoolLoading || !mempool ? (
              <Card>
                <CardContent>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                    <StatSkeleton />
                    <StatSkeleton />
                    <StatSkeleton />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                    <Stat
                      label="느림 (~1시간)"
                      value={`${mempool.hourFee} sat/vB`}
                      valueClassName="text-green-400"
                    />
                    <Stat
                      label="보통 (~30분)"
                      value={`${mempool.halfHourFee} sat/vB`}
                      valueClassName="text-yellow-400"
                    />
                    <Stat
                      label="빠름 (~10분)"
                      value={`${mempool.fastFee} sat/vB`}
                      valueClassName="text-orange-400"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </Section>

          {/* 멤풀 블록 (예상) */}
          <Section title="멤풀 블록 (예상)" relativeTime={mempoolBlocksRelTime}>
            {mempoolBlocksLoading || !mempoolBlocks ? (
              <Card>
                <CardContent>
                  <div className="flex gap-2">
                    <Skeleton className="h-[88px] w-[120px] rounded-md" />
                    <Skeleton className="h-[88px] w-[120px] rounded-md" />
                    <Skeleton className="h-[88px] w-[120px] rounded-md" />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <MempoolBlocksViz blocks={mempoolBlocks.blocks} />
            )}
          </Section>

          {/* 최근 블록 */}
          <Section title="최근 블록" relativeTime={recentBlocksRelTime}>
            {recentBlocksLoading || !recentBlocks ? (
              <Card>
                <CardContent className="flex flex-col gap-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-full" />
                  ))}
                </CardContent>
              </Card>
            ) : (
              <RecentBlocksList blocks={recentBlocks.blocks} />
            )}
          </Section>

          {/* 채굴 */}
          <Section title="채굴" relativeTime={miningRelTime}>
            {miningLoading || !mining ? (
              <Card>
                <CardContent>
                  <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-5">
                      <StatSkeleton hasChange />
                      <StatSkeleton />
                      <StatSkeleton />
                      <StatSkeleton />
                      <StatSkeleton />
                    </div>
                    <div>
                      <div className="mb-1.5 flex justify-between">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-8" />
                      </div>
                      <Skeleton className="h-2 w-full rounded-full" />
                      <Skeleton className="mt-1.5 h-3 w-32" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent>
                  <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-5">
                      <Stat
                        label="해시레이트"
                        value={`${mining.hashrateEHs} EH/s`}
                        change={mining.hashrateChangePct}
                      />
                      <Stat
                        label="블록 보상"
                        value={`${mining.blockRewardBTC} BTC`}
                      />
                      <Stat
                        label="남은 블록"
                        value={mining.remainingBlocks.toLocaleString()}
                      />
                      <Stat
                        label="예상 변화율"
                        value={`${mining.difficultyChangePct > 0 ? "+" : ""}${mining.difficultyChangePct}%`}
                        valueClassName={
                          mining.difficultyChangePct >= 0
                            ? "text-green-500"
                            : "text-red-500"
                        }
                      />
                      <Stat
                        label="이전 변화율"
                        value={`${mining.previousDifficultyChangePct > 0 ? "+" : ""}${mining.previousDifficultyChangePct}%`}
                        valueClassName={
                          mining.previousDifficultyChangePct >= 0
                            ? "text-green-500"
                            : "text-red-500"
                        }
                      />
                    </div>
                    <div>
                      {(() => {
                        const pct =
                          ((2016 - mining.remainingBlocks) / 2016) * 100;
                        return (
                          <>
                            <div className="mb-1.5 flex justify-between text-xs">
                              <span className="text-muted-foreground">
                                난이도 조정 진행
                              </span>
                              <span className="font-medium">
                                {pct.toFixed(1)}%
                              </span>
                            </div>
                            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                              <div
                                className="h-full rounded-full bg-blue-500 transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <p className="text-muted-foreground mt-1.5 text-xs">
                              예상 조정일: {mining.estimatedRetargetDate}
                            </p>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </Section>

          {/* 해시레이트 추이 */}
          <Section title="해시레이트 추이 (1년)" relativeTime={hashrateRelTime}>
            {hashrateLoading || !hashrate ? (
              <Card>
                <CardContent>
                  <Skeleton className="h-[240px] w-full" />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="text-muted-foreground flex justify-end gap-4 px-4 py-3 text-xs">
                    <span>현재 {hashrate.currentHashrateEHs} EH/s</span>
                    <span>난이도 {hashrate.currentDifficultyT}T</span>
                  </div>
                  <HashrateChart data={hashrate} />
                  <div className="h-2" />
                </CardContent>
              </Card>
            )}
          </Section>

          {/* 채굴풀 점유율 */}
          <Section title="채굴풀 점유율 (1주)" relativeTime={poolsRelTime}>
            {poolsLoading || !pools ? (
              <Card>
                <CardContent>
                  <div className="flex flex-col items-center gap-6 sm:flex-row">
                    <Skeleton className="h-[160px] w-[160px] shrink-0 rounded-full" />
                    <div className="grid w-full grid-cols-1 gap-2 sm:flex-1 sm:grid-cols-2">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-4 w-full" />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <PoolShareChart pools={pools.pools} />
            )}
          </Section>

          {/* 반감기 */}
          <Section title="반감기" relativeTime={miningRelTime}>
            {miningLoading || !mining ? (
              <Card>
                <CardContent>
                  <div className="flex flex-col items-center gap-6 sm:flex-row">
                    <Skeleton className="h-[140px] w-[140px] shrink-0 rounded-full" />
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:flex-1">
                      <StatSkeleton />
                      <StatSkeleton />
                      <StatSkeleton />
                      <StatSkeleton />
                      <StatSkeleton />
                      <StatSkeleton />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent>
                  <div className="flex flex-col items-center gap-6 sm:flex-row">
                    <DonutRing
                      progress={
                        ((210_000 - mining.remainingHalvingBlocks) / 210_000) *
                        100
                      }
                      color="#f7931a"
                      center={`${(((210_000 - mining.remainingHalvingBlocks) / 210_000) * 100).toFixed(1)}%`}
                      centerSub="경과"
                    />
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:flex-1">
                      <Stat
                        label="현재 블록"
                        value={mining.blockHeight.toLocaleString()}
                      />
                      <Stat
                        label="다음 반감기 블록"
                        value={mining.nextHalvingBlock.toLocaleString()}
                      />
                      <Stat
                        label="남은 블록"
                        value={mining.remainingHalvingBlocks.toLocaleString()}
                      />
                      <Stat
                        label="예상 날짜"
                        value={mining.estimatedHalvingDate}
                      />
                      <Stat
                        label="현재 보상"
                        value={`${mining.blockRewardBTC} BTC`}
                      />
                      <Stat
                        label="반감기 후 보상"
                        value={`${mining.nextRewardBTC} BTC`}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </Section>

          {/* 네트워크 */}
          <Section title="네트워크" relativeTime={lightningRelTime}>
            {lightningLoading || !lightning ? (
              <Card>
                <CardContent>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                    <StatSkeleton hasChange />
                    <StatSkeleton hasChange />
                    <StatSkeleton hasChange />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                    <Stat
                      label="라이트닝 노드"
                      value={lightning.nodeCount.toLocaleString()}
                      change={lightning.nodeCountChangePct}
                    />
                    <Stat
                      label="라이트닝 채널"
                      value={lightning.channelCount.toLocaleString()}
                      change={lightning.channelCountChangePct}
                    />
                    <Stat
                      label="라이트닝 용량"
                      value={`${lightning.totalCapacityBTC.toLocaleString()} BTC`}
                      change={lightning.capacityChangePct}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </Section>
        </div>
      </PageMain>
    </>
  );
}
