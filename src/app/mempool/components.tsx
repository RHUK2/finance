'use client';

import { useEffect, useRef } from 'react';

import { Panel } from '@/components/panel';
import { Skeleton } from '@/components/ui/skeleton';
import type { MempoolBlocksData, MempoolStatsData, MiningPoolsData, RecentBlocksData } from '@/hooks/use-mempool';
import { formatRelativeTime } from '@/hooks/use-relative-time';
import { useScrollDrag } from '@/hooks/use-scroll-drag';
import { cn } from '@/lib/utils';

// 블록 한도는 weight 4M WU = 1 MvB다. 충전율은 실제 직렬화 크기(size)가 아니라
// 가상 크기(vMB)로 재야 한다. 꽉 찬 블록의 실제 크기는 보통 1.5~2MB로 1MB를 넘는다.
const MAX_BLOCK_MB = 1.0;

const SERIES = ['bg-series-1', 'bg-series-2', 'bg-series-3', 'bg-series-4'];

const fillPct = (vMB: number) => `${Math.min((vMB / MAX_BLOCK_MB) * 100, 100)}%`;

/**
 * 첫 데이터 없이 요청이 실패했을 때 스켈레톤 자리에 둔다. 스켈레톤을 남기면 끝나지 않는
 * 로딩으로 읽혀 장애인지 느린 것인지 가를 수 없다. 높이는 대신하는 스켈레톤과 같게 넘긴다.
 */
export function LoadFailed({ className }: { className: string }) {
  return (
    <div
      role='status'
      className={cn(
        'flex w-full items-center justify-center rounded-md border border-dashed px-4 text-center text-xs text-muted-foreground',
        className,
      )}
    >
      데이터를 받지 못했습니다. 잠시 뒤 다시 시도합니다.
    </div>
  );
}

/**
 * 이 페이지는 카드 격자가 아니라 구획 셋으로 나뉜다. 제목이 상자 밖에 있어서
 * `CardHeader`를 쓰지 않으므로 상자는 `Card`가 아니라 `Panel`이다(ADR 0010).
 */
export function SectionHeading({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className='mb-3 flex items-baseline justify-between gap-3 border-b pb-2'>
      <h2 className='text-sm font-semibold'>{children}</h2>
      {aside && (
        // 상대시간은 서버 렌더와 하이드레이션 사이에 분이 넘어가면 텍스트가 어긋난다.
        <span className='text-xs text-muted-foreground' suppressHydrationWarning>
          {aside}
        </span>
      )}
    </div>
  );
}

function ConfirmedBlock({ block }: { block: RecentBlocksData['blocks'][number] }) {
  return (
    <div className='flex w-29 flex-col gap-1.5 rounded-md bg-card p-2.5 ring-1 ring-foreground/10'>
      <span className='text-3xs text-muted-foreground' suppressHydrationWarning>
        {formatRelativeTime(block.timestamp * 1000)}
      </span>
      <span className='text-sm font-bold tabular-nums'>#{block.height.toLocaleString('ko-KR')}</span>
      <div className='h-1 w-full overflow-hidden rounded-full bg-muted'>
        <div className='h-full rounded-full bg-series-4/60' style={{ width: fillPct(block.vMB) }} />
      </div>
      <span className='truncate text-3xs text-muted-foreground'>{block.poolName}</span>
      <span className='text-3xs text-muted-foreground tabular-nums'>
        {block.txCount.toLocaleString('ko-KR')} tx · {block.medianFee} sat/vB
      </span>
    </div>
  );
}

function PendingBlock({ block, offset }: { block: MempoolBlocksData['blocks'][number]; offset: number }) {
  return (
    <div className='flex w-29 flex-col gap-1.5 rounded-md border border-dashed border-series-3/60 bg-series-3/5 p-2.5'>
      <span className='text-3xs text-series-3'>{offset === 0 ? '다음 블록' : `+${offset} 블록 뒤`}</span>
      <span className='text-sm font-bold tabular-nums'>~{block.medianFee} sat/vB</span>
      <div className='h-1 w-full overflow-hidden rounded-full bg-muted'>
        <div className='h-full rounded-full bg-series-3' style={{ width: fillPct(block.vMB) }} />
      </div>
      <span className='text-3xs text-muted-foreground tabular-nums'>
        {block.feeMin}~{block.feeMax}
      </span>
      <span className='text-3xs text-muted-foreground tabular-nums'>{block.nTx.toLocaleString('ko-KR')} tx</span>
    </div>
  );
}

function NowCard({ mempool, nowRef }: { mempool: MempoolStatsData; nowRef: React.RefObject<HTMLDivElement | null> }) {
  const fees = [
    { label: '10분', value: mempool.fastFee, tone: 'text-bad' },
    { label: '30분', value: mempool.halfHourFee, tone: 'text-warn' },
    { label: '1시간', value: mempool.hourFee, tone: 'text-good' },
  ];

  return (
    <div
      ref={nowRef}
      className='flex w-47 flex-col gap-2 rounded-md bg-warn-surface/10 p-3 ring-2 ring-warn-surface/50'
    >
      <span className='text-3xs font-semibold text-warn'>지금 · 멤풀</span>
      <span className='text-2xl leading-none font-bold tabular-nums'>
        {mempool.pendingTxCount.toLocaleString('ko-KR')}
      </span>
      <span className='text-3xs text-muted-foreground'>미확인 트랜잭션 · {mempool.mempoolVMB} vMB</span>
      <div className='mt-1 grid grid-cols-3 gap-1 text-center'>
        {fees.map((f) => (
          <div key={f.label} className='rounded-sm bg-background/60 py-1'>
            <p className={cn('text-sm font-bold tabular-nums', f.tone)}>{f.value}</p>
            <p className='text-3xs text-muted-foreground'>{f.label}</p>
          </div>
        ))}
      </div>
      <span className='text-3xs text-muted-foreground'>sat/vB, 목표 확인 시간별</span>
    </div>
  );
}

/**
 * 확정된 블록 → 지금(멤풀) → 예상 블록을 한 줄에 늘어놓는다. 화면의 위계가 주제가
 * 아니라 시간이라, 대기 중인 트랜잭션이 어디쯤 서 있는지를 배치 자체가 답한다.
 */
export function BlockTimeline({
  mempool,
  pending,
  confirmed,
  error,
}: {
  mempool?: MempoolStatsData;
  pending?: MempoolBlocksData['blocks'];
  confirmed?: RecentBlocksData['blocks'];
  /** 셋 중 비어 있는 것이 요청 실패로 비었다 */
  error?: boolean;
}) {
  const { ref, handlers, maskStyle } = useScrollDrag();

  // 축의 기준점은 "지금"이다. 데이터가 들어오면 그 칸이 보이는 자리로 한 번 밀어 준다.
  // 이후 폴링으로 값이 갱신될 때 사용자가 움직여 둔 스크롤 위치를 빼앗지 않도록 한 번만 한다.
  const nowRef = useRef<HTMLDivElement>(null);
  const centered = useRef(false);
  useEffect(() => {
    if (centered.current || !nowRef.current) return;
    centered.current = true;
    nowRef.current.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [mempool]);

  if (!mempool || !pending || !confirmed) {
    return error ? <LoadFailed className='h-[188px]' /> : <Skeleton className='h-[188px] w-full' />;
  }

  // 시간 순으로 읽히도록 최신 블록이 오른쪽(= "지금" 쪽)에 오게 뒤집는다.
  const past = [...confirmed].slice(0, 5).reverse();

  return (
    <div
      // 링(ring-1·ring-2)은 보더 박스 바깥에 그려져 스크롤 컨테이너가 위아래·양끝을 잘라
      // 먹는다. 패딩으로 자리를 내주고 같은 크기의 음수 마진으로 왼쪽 끝을 제목에 다시 맞춘다.
      ref={ref}
      className='-mx-1.5 cursor-grab scrollbar-none overflow-x-auto p-1.5 select-none active:cursor-grabbing [&::-webkit-scrollbar]:hidden'
      style={maskStyle}
      {...handlers}
    >
      <div className='flex w-max items-stretch gap-2'>
        {past.map((b) => (
          <ConfirmedBlock key={b.height} block={b} />
        ))}
        <NowCard mempool={mempool} nowRef={nowRef} />
        {pending.slice(0, 6).map((b, i) => (
          <PendingBlock key={i} block={b} offset={i} />
        ))}
      </div>
    </div>
  );
}

/** 진행도 막대 하나짜리 패널. 난이도 조정과 반감기가 같은 모양을 쓴다. */
export function ProgressPanel({
  title,
  headline,
  headlineClassName,
  progress,
  color,
  rows,
}: {
  title: string;
  headline: string;
  headlineClassName?: string;
  progress: number;
  /** 넘기지 않으면 계열색 기본값(series-4) */
  color?: string;
  rows: [string, string][];
}) {
  return (
    <Panel className='gap-2'>
      <div className='flex items-baseline justify-between gap-2'>
        <span className='text-xs text-muted-foreground'>{title}</span>
        <span className={cn('text-sm font-bold tabular-nums', headlineClassName)}>{headline}</span>
      </div>
      <div className='h-1.5 w-full overflow-hidden rounded-full bg-muted'>
        <div
          className={cn('h-full rounded-full', !color && 'bg-series-4')}
          style={{ width: `${progress}%`, backgroundColor: color }}
        />
      </div>
      {rows.map(([label, value]) => (
        <div key={label} className='flex justify-between gap-2 text-xs'>
          <span className='text-muted-foreground'>{label}</span>
          <span className='tabular-nums'>{value}</span>
        </div>
      ))}
    </Panel>
  );
}

/**
 * 총량 하나(최근 블록 전부)가 풀별 몫으로 갈리는 그림이라 누적막대를 쓴다.
 * 도넛과 달리 과반선을 눈으로 재기 쉽다. 로더가 상위 3개 + 기타로 조각을 넷 이하로 주므로
 * 계열색 넷이 조각과 범례를 하나씩 잇는다(src/lib/loaders/mining-pools.ts).
 */
export function PoolShareBar({ pools, error }: { pools?: MiningPoolsData['pools']; error?: boolean }) {
  if (!pools) return error ? <LoadFailed className='h-[120px]' /> : <Skeleton className='h-[120px] w-full' />;

  return (
    <>
      <div className='flex h-6 w-full overflow-hidden rounded-md'>
        {pools.map((p, i) => (
          <div
            key={p.slug}
            className={cn(SERIES[i % SERIES.length])}
            style={{ width: `${p.sharePct}%` }}
            title={`${p.name} ${p.sharePct}%`}
          />
        ))}
      </div>
      <ul className='mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-4'>
        {pools.map((p, i) => (
          <li key={p.slug} className='flex items-center justify-between gap-2 text-xs'>
            <span className='flex min-w-0 items-center gap-1.5'>
              <span className={cn('size-2 shrink-0 rounded-full', SERIES[i % SERIES.length])} />
              <span className='truncate'>{p.name}</span>
            </span>
            <span className='shrink-0 text-muted-foreground tabular-nums'>{p.sharePct}%</span>
          </li>
        ))}
      </ul>
    </>
  );
}
