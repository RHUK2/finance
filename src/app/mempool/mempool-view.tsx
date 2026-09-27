'use client';

import { AppHeader } from '@/components/app-header';
import { HashrateChart } from '@/components/hashrate-chart';
import { PageMain } from '@/components/page-main';
import { Panel } from '@/components/panel';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useHashrateHistory,
  useMempoolBlocks,
  useMempoolStats,
  useMiningPools,
  useMiningStats,
  useRecentBlocks,
} from '@/hooks/use-mempool';
import { formatRelativeTime, useMinuteTick } from '@/hooks/use-relative-time';
import { BLOCKS_PER_HALVING, RETARGET_INTERVAL } from '@/lib/bitcoin-models';
import { BTC_COLOR, cn } from '@/lib/utils';

import { BlockTimeline, PoolShareBar, ProgressPanel, SectionHeading } from './components';

export function MempoolView() {
  const { data: mempool } = useMempoolStats();
  const { data: mining } = useMiningStats();
  const { data: mempoolBlocks } = useMempoolBlocks();
  const { data: recentBlocks } = useRecentBlocks();
  const { data: hashrate } = useHashrateHistory();
  const { data: pools } = useMiningPools();

  // 상대시간 라벨을 타이머 하나로 갱신
  useMinuteTick();
  // 한 구획이 여러 엔드포인트를 쓰면 그중 가장 오래된 값이 그 구획의 신선도다.
  const oldest = (...isos: (string | undefined)[]) => {
    const times = isos.filter((t): t is string => Boolean(t)).map((t) => new Date(t).getTime());
    return times.length > 0 ? formatRelativeTime(Math.min(...times)) : undefined;
  };

  const timelineTime = oldest(mempool?.fetchedAt, mempoolBlocks?.fetchedAt, recentBlocks?.fetchedAt);
  const miningTime = oldest(mining?.fetchedAt, hashrate?.fetchedAt);

  const halvingProgress = mining
    ? ((BLOCKS_PER_HALVING - mining.remainingHalvingBlocks) / BLOCKS_PER_HALVING) * 100
    : 0;
  const difficultyProgress = mining ? ((RETARGET_INTERVAL - mining.remainingBlocks) / RETARGET_INTERVAL) * 100 : 0;

  return (
    <>
      <AppHeader />
      <PageMain>
        <div className='flex flex-col gap-8'>
          {/* 시간축 */}
          <section>
            <SectionHeading aside={timelineTime && `${timelineTime} 기준`}>
              블록 시간축 · 확정된 블록에서 대기 중인 블록까지
            </SectionHeading>
            <BlockTimeline mempool={mempool} pending={mempoolBlocks?.blocks} confirmed={recentBlocks?.blocks} />
            <p className='mt-2 text-xs text-muted-foreground'>
              왼쪽이 이미 확정된 블록, 가운데가 아직 블록에 담기지 않은 대기 물량, 오른쪽이 그 물량이 몇 번째 블록에서
              처리될지 예측한 값입니다. 오른쪽으로 갈수록 수수료가 낮은 트랜잭션이 밀려 있습니다. 미확인 거래가 많고
              멤풀이 클수록 처리 대기가 길고 수수료가 오릅니다.
            </p>
          </section>

          {/* 채굴 */}
          <section>
            <SectionHeading aside={miningTime && `${miningTime} 기준`}>
              이 축을 미는 힘 · 해시레이트와 난이도
            </SectionHeading>
            {!mining || !hashrate ? (
              <Skeleton className='h-[300px] w-full' />
            ) : (
              <div className='grid gap-4 lg:grid-cols-[2fr_1fr]'>
                <Panel bleed>
                  <div className='flex items-baseline justify-between gap-3 px-4 py-3'>
                    <span className='text-xl font-bold tabular-nums'>{mining.hashrateEHs} EH/s</span>
                    <span
                      className={cn('text-xs tabular-nums', mining.hashrateChangePct >= 0 ? 'text-good' : 'text-bad')}
                    >
                      1주 전 대비 {mining.hashrateChangePct >= 0 ? '+' : ''}
                      {mining.hashrateChangePct.toFixed(2)}%
                    </span>
                  </div>
                  <HashrateChart data={hashrate} />
                </Panel>
                <div className='flex flex-col gap-4'>
                  <ProgressPanel
                    title='다음 난이도 조정'
                    headline={`${mining.difficultyChangePct > 0 ? '+' : ''}${mining.difficultyChangePct}%`}
                    headlineClassName={mining.difficultyChangePct >= 0 ? 'text-good' : 'text-bad'}
                    progress={difficultyProgress}
                    rows={[
                      ['남은 블록', mining.remainingBlocks.toLocaleString()],
                      ['예상일', mining.estimatedRetargetDate],
                    ]}
                  />
                  <ProgressPanel
                    title='다음 반감기'
                    headline={`${mining.blockRewardBTC} → ${mining.nextRewardBTC} BTC`}
                    progress={halvingProgress}
                    color={BTC_COLOR}
                    rows={[
                      ['남은 블록', mining.remainingHalvingBlocks.toLocaleString()],
                      ['예상일', mining.estimatedHalvingDate],
                    ]}
                  />
                </div>
              </div>
            )}
            <p className='mt-3 text-xs text-muted-foreground'>
              해시레이트는 네트워크 보안 강도 지표로 활용됩니다. 높을수록 공격 비용이 커지고, 꾸준한 상승은 보안 강화를,
              급격한 하락은 대규모 채굴자 이탈 신호로 읽힙니다. 난이도는 2016블록마다 조정되고, 반감기는 약 4년마다
              보상을 절반으로 줄여 신규 발행량을 낮춥니다. 반감기 뒤 강세장이 이어졌다는 관찰은 표본이 네 번뿐이고 다른
              요인과 분리되지 않아 인과로 보기 어렵습니다.
            </p>
          </section>

          {/* 채굴풀 */}
          <section>
            <SectionHeading aside={pools && `최근 ${pools.totalBlocks.toLocaleString()} 블록`}>
              누가 이 블록들을 만들었나 · 채굴풀 점유율 (1주)
            </SectionHeading>
            <PoolShareBar pools={pools?.pools} />
            <p className='mt-3 text-xs text-muted-foreground'>
              채굴풀별 블록 점유율은 네트워크 탈중앙화 지표로 활용됩니다. 한 풀이 과반을 오래 유지하면 체인 재구성
              위험이 커집니다. 다만 풀의 해시레이트는 독립 채굴자들이 빌려준 것이라 언제든 다른 풀로 옮겨갈 수 있고,
              과반을 쥐어도 뒤집을 수 있는 범위는 공격자 자신이 최근에 보낸 거래로 한정됩니다.
            </p>
          </section>
        </div>
      </PageMain>
    </>
  );
}
