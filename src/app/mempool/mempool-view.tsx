"use client";

import { AppHeader } from "@/components/app-header";
import { HashrateChart } from "@/components/hashrate-chart";
import { PageMain } from "@/components/page-main";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useHashrateHistory,
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
  Stat,
} from "./components";

export function MempoolView() {
  const { data: mempool } = useMempoolStats();
  const { data: mining } = useMiningStats();
  const { data: mempoolBlocks } = useMempoolBlocks();
  const { data: recentBlocks } = useRecentBlocks();
  const { data: hashrate } = useHashrateHistory();
  const { data: pools } = useMiningPools();

  const mempoolRelTime = useRelativeTime(mempool?.fetchedAt);
  const miningRelTime = useRelativeTime(mining?.fetchedAt);
  const mempoolBlocksRelTime = useRelativeTime(mempoolBlocks?.fetchedAt);
  const recentBlocksRelTime = useRelativeTime(recentBlocks?.fetchedAt);
  const hashrateRelTime = useRelativeTime(hashrate?.fetchedAt);
  const poolsRelTime = useRelativeTime(pools?.fetchedAt);

  const halvingProgress = mining ? ((210_000 - mining.remainingHalvingBlocks) / 210_000) * 100 : 0;
  const difficultyProgress = mining ? ((2016 - mining.remainingBlocks) / 2016) * 100 : 0;

  return (
    <>
      <AppHeader breadcrumbs={[{ label: "비트코인 네트워크" }]} />
      <PageMain>
        <div className="flex flex-col gap-6">

          {/* 멤풀 */}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-muted-foreground text-sm font-medium">멤풀</CardTitle>
                  {mempoolRelTime && <span className="text-muted-foreground text-xs">{mempoolRelTime}</span>}
                </div>
              </CardHeader>
              <CardContent>
                {!mempool ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <div className="grid grid-cols-2 gap-x-6">
                    <Stat label="미확인 트랜잭션" value={mempool.pendingTxCount.toLocaleString()} />
                    <Stat label="멤풀 크기" value={`${mempool.mempoolSizeMB} MB`} />
                  </div>
                )}
                <p className="bg-muted/50 text-muted-foreground mt-4 rounded-md px-3 py-2.5 text-xs">
                  아직 블록에 포함되지 않고 대기 중인 트랜잭션 현황. 미확인 거래가 많을수록 네트워크가 혼잡하며 수수료가 높아집니다.
                </p>
              </CardContent>
            </Card>
          {/* 수수료 */}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-muted-foreground text-sm font-medium">수수료</CardTitle>
                  {mempoolRelTime && <span className="text-muted-foreground text-xs">{mempoolRelTime}</span>}
                </div>
              </CardHeader>
              <CardContent>
                {!mempool ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                    <Stat label="느림 (~1시간)" value={`${mempool.hourFee} sat/vB`} valueClassName="text-green-400" />
                    <Stat label="보통 (~30분)" value={`${mempool.halfHourFee} sat/vB`} valueClassName="text-yellow-400" />
                    <Stat label="빠름 (~10분)" value={`${mempool.fastFee} sat/vB`} valueClassName="text-orange-400" />
                  </div>
                )}
                <p className="bg-muted/50 text-muted-foreground mt-4 rounded-md px-3 py-2.5 text-xs">
                  원하는 시간 내에 트랜잭션을 처리하기 위해 필요한 네트워크 수수료. 네트워크 혼잡도에 따라 실시간으로 변동합니다.
                </p>
              </CardContent>
            </Card>
          {/* 멤풀 블록 (예상) */}

            <MempoolBlocksViz
              blocks={mempoolBlocks?.blocks}
              title="멤풀 블록 (예상)"
              relativeTime={mempoolBlocksRelTime ?? undefined}
              description="현재 멤풀에 대기 중인 트랜잭션들이 향후 몇 개의 블록에 나뉘어 처리될지 예상한 시각화. 왼쪽 블록일수록 먼저 채굴됩니다."
            />
          {/* 최근 블록 */}

            <RecentBlocksList
              blocks={recentBlocks?.blocks}
              title="최근 블록"
              relativeTime={recentBlocksRelTime ?? undefined}
              description="가장 최근에 채굴 완료된 블록 목록. 채굴풀·처리 시간·수수료 등 블록 상세 정보를 통해 네트워크 처리 흐름을 확인할 수 있습니다."
            />
          {/* 채굴 */}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-muted-foreground text-sm font-medium">채굴</CardTitle>
                  {miningRelTime && <span className="text-muted-foreground text-xs">{miningRelTime}</span>}
                </div>
              </CardHeader>
              <CardContent>
                {!mining ? (
                  <Skeleton className="h-[148px] w-full" />
                ) : (
                  <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-5">
                      <Stat label="해시레이트" value={`${mining.hashrateEHs} EH/s`} change={mining.hashrateChangePct} />
                      <Stat label="블록 보상" value={`${mining.blockRewardBTC} BTC`} />
                      <Stat label="남은 블록" value={mining.remainingBlocks.toLocaleString()} />
                      <Stat
                        label="예상 변화율"
                        value={`${mining.difficultyChangePct > 0 ? "+" : ""}${mining.difficultyChangePct}%`}
                        valueClassName={mining.difficultyChangePct >= 0 ? "text-green-500" : "text-red-500"}
                      />
                      <Stat
                        label="이전 변화율"
                        value={`${mining.previousDifficultyChangePct > 0 ? "+" : ""}${mining.previousDifficultyChangePct}%`}
                        valueClassName={mining.previousDifficultyChangePct >= 0 ? "text-green-500" : "text-red-500"}
                      />
                    </div>
                    <div>
                      <div className="mb-1.5 flex justify-between text-xs">
                        <span className="text-muted-foreground">난이도 조정 진행</span>
                        <span className="font-medium">{difficultyProgress.toFixed(1)}%</span>
                      </div>
                      <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                        <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${difficultyProgress}%` }} />
                      </div>
                      <p className="text-muted-foreground mt-1.5 text-xs">예상 조정일: {mining.estimatedRetargetDate}</p>
                    </div>
                  </div>
                )}
                <p className="bg-muted/50 text-muted-foreground mt-6 rounded-md px-3 py-2.5 text-xs">
                  네트워크 연산 능력(해시레이트)과 2016블록마다 자동 조정되는 채굴 난이도 현황. 해시레이트가 높을수록 네트워크 보안이 강하고 채굴 경쟁이 치열합니다.
                </p>
              </CardContent>
            </Card>
          {/* 해시레이트 추이 */}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-muted-foreground text-sm font-medium">해시레이트 추이 (1년)</CardTitle>
                  {hashrateRelTime && <span className="text-muted-foreground text-xs">{hashrateRelTime}</span>}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {!hashrate ? (
                  <Skeleton className="h-[288px] w-full rounded-none" />
                ) : (
                  <>
                    <div className="text-muted-foreground flex justify-end gap-4 px-4 py-3 text-xs">
                      <span>현재 {hashrate.currentHashrateEHs} EH/s</span>
                      <span>난이도 {hashrate.currentDifficultyT}T</span>
                    </div>
                    <HashrateChart data={hashrate} />
                  </>
                )}
                <p className="bg-muted/50 text-muted-foreground px-6 pt-3 pb-4 text-xs">
                  네트워크 전체 연산 능력의 1년 변화 추이. 해시레이트 상승은 채굴자 신뢰 증가와 네트워크 보안 강화를 의미하며, 급격한 하락은 대규모 채굴자 이탈 신호일 수 있습니다.
                </p>
              </CardContent>
            </Card>
          {/* 채굴풀 점유율 */}

            <PoolShareChart
              pools={pools?.pools}
              title="채굴풀 점유율 (1주)"
              relativeTime={poolsRelTime ?? undefined}
              description="지난 1주 동안 각 채굴풀이 채굴한 블록 수와 비율. 특정 풀의 점유율이 50%를 초과하면 51% 공격 위험성이 높아지므로 분산화 지표로 활용됩니다."
            />
          {/* 반감기 */}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-muted-foreground text-sm font-medium">반감기</CardTitle>
                  {miningRelTime && <span className="text-muted-foreground text-xs">{miningRelTime}</span>}
                </div>
              </CardHeader>
              <CardContent>
                {!mining ? (
                  <Skeleton className="h-[140px] w-full" />
                ) : (
                  <div className="flex flex-col items-center gap-6 sm:flex-row">
                    <DonutRing
                      progress={halvingProgress}
                      color="#f7931a"
                      center={`${halvingProgress.toFixed(1)}%`}
                      centerSub="경과"
                    />
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:flex-1">
                      <Stat label="현재 블록" value={mining.blockHeight.toLocaleString()} />
                      <Stat label="다음 반감기 블록" value={mining.nextHalvingBlock.toLocaleString()} />
                      <Stat label="남은 블록" value={mining.remainingHalvingBlocks.toLocaleString()} />
                      <Stat label="예상 날짜" value={mining.estimatedHalvingDate} />
                      <Stat label="현재 보상" value={`${mining.blockRewardBTC} BTC`} />
                      <Stat label="반감기 후 보상" value={`${mining.nextRewardBTC} BTC`} />
                    </div>
                  </div>
                )}
                <p className="bg-muted/50 text-muted-foreground mt-6 rounded-md px-3 py-2.5 text-xs">
                  약 4년마다 블록 보상이 절반으로 줄어드는 이벤트. 신규 공급량이 감소하면서 희소성이 높아지고, 역사적으로 반감기 이후 강세장이 나타나는 경향이 있습니다.
                </p>
              </CardContent>
            </Card>
        </div>
      </PageMain>
    </>
  );
}
