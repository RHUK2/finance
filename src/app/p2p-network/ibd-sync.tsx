'use client';

import { useState } from 'react';
import { Download, FileStack } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { ExplainCard, Metric, RoundControls, SectionIntro } from '@/components/simulation';
import { useRoundEngine } from '@/hooks/use-round-engine';
import { cn } from '@/lib/utils';
import { AVG_BLOCK_BYTES, blocksBytes, formatBytes, headersBytes, TOTAL_BLOCKS_APPROX } from '@/lib/p2p-concept';

const HEADER_ROUNDS = 10; // 헤더 체인은 가볍기 때문에 빠르게 끝난다
const BLOCK_ROUNDS = 30; // 블록 본문은 헤더보다 훨씬 무거워 더 오래 걸린다
const TOTAL_ROUNDS = HEADER_ROUNDS + BLOCK_ROUNDS;

function headersAt(round: number): number {
  return Math.min(
    TOTAL_BLOCKS_APPROX,
    Math.round((Math.min(round, HEADER_ROUNDS) / HEADER_ROUNDS) * TOTAL_BLOCKS_APPROX),
  );
}

function blocksAt(round: number): number {
  const blockRound = Math.max(0, round - HEADER_ROUNDS);
  return Math.min(TOTAL_BLOCKS_APPROX, Math.round((blockRound / BLOCK_ROUNDS) * TOTAL_BLOCKS_APPROX));
}

export function IbdSync() {
  const [round, setRound] = useState(0);
  const [speedMs, setSpeedMs] = useState(280);

  const headersDownloaded = headersAt(round);
  const blocksDownloaded = blocksAt(round);
  const done = round >= TOTAL_ROUNDS;

  function step(): boolean {
    if (round >= TOTAL_ROUNDS) return false;
    setRound((r) => r + 1);
    return round + 1 < TOTAL_ROUNDS;
  }

  const engine = useRoundEngine(step, speedMs);

  const headersPct = (headersDownloaded / TOTAL_BLOCKS_APPROX) * 100;
  const blocksPct = (blocksDownloaded / TOTAL_BLOCKS_APPROX) * 100;

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='헤더 먼저, 블록은 나중에 (Headers-First)'>
        새 노드가 네트워크에 처음 참여하면 지금까지의 전체 체인(약 {TOTAL_BLOCKS_APPROX.toLocaleString('ko-KR')}개
        블록)을 검증해야 한다. 블록 전체({formatBytes(AVG_BLOCK_BYTES)} 안팎)를 처음부터 순서대로 받으면 너무 느리니,
        먼저 <b>80바이트짜리 헤더만 이어 붙여 작업량이 가장 많은 체인을 빠르게 확정</b>한 다음, 그 체인을 따라 블록
        본문을 여러 피어에게서 병렬로 받는다.
      </SectionIntro>

      <Card className='flex flex-col gap-4 p-4'>
        <RoundControls
          playing={engine.playing}
          onToggle={engine.toggle}
          onStep={step}
          onReset={() => {
            engine.pause();
            setRound(0);
          }}
          round={round}
          speedMs={speedMs}
          onSpeed={setSpeedMs}
          done={done}
          unit='라운드'
        />

        <SyncBar
          icon={<FileStack className='size-4 text-amber-600 dark:text-amber-400' />}
          label='① 헤더 체인'
          pct={headersPct}
          detail={`${headersDownloaded.toLocaleString('ko-KR')} / ${TOTAL_BLOCKS_APPROX.toLocaleString('ko-KR')}개 · ${formatBytes(headersBytes(headersDownloaded))}`}
          tone='accent'
        />
        <SyncBar
          icon={<Download className='size-4 text-emerald-600 dark:text-emerald-400' />}
          label='② 블록 본문'
          pct={blocksPct}
          detail={`${blocksDownloaded.toLocaleString('ko-KR')} / ${TOTAL_BLOCKS_APPROX.toLocaleString('ko-KR')}개 · ${formatBytes(blocksBytes(blocksDownloaded))}`}
          tone='good'
        />

        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
          <Metric label='헤더 전체 용량' value={formatBytes(headersBytes(TOTAL_BLOCKS_APPROX))} />
          <Metric label='블록 전체 용량' value={formatBytes(blocksBytes(TOTAL_BLOCKS_APPROX))} tone='accent' />
          <Metric label='크기 비율' value={`약 ${Math.round(AVG_BLOCK_BYTES / 80).toLocaleString('ko-KR')}배`} />
        </div>
      </Card>

      <ExplainCard
        icon={<FileStack className='size-4 text-amber-600 dark:text-amber-400' />}
        title='헤더만 봐도 "어느 체인이 진짜 최장 작업량 체인인지" 알 수 있는 이유'
        preview='헤더에는 이전 헤더 해시·난이도 목표·nonce가 들어 있어, 누적 작업량을 계산하는 데 블록 본문이 필요 없다.'
        body={
          <>
            헤더 80바이트 안에는 이전 블록 해시, 난이도 목표(bits), nonce가 모두 들어 있다. 이 값들만으로 각 헤더가{' '}
            <b>목표 이하의 해시를 실제로 만족하는지</b>, 그리고 체인 전체의 <b>누적 작업량</b>이 얼마인지 계산할 수
            있다. 그래서 노드는 무거운 블록 본문(트랜잭션 전체)을 받기 전에 헤더만으로 먼저 &#39;어느 체인을 받을 가치가
            있는지&#39;를 정하고, 그 체인의 블록만 받아 트랜잭션 서명·잔액을 검증한다.
          </>
        }
      />
    </div>
  );
}

function SyncBar({
  icon,
  label,
  pct,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  pct: number;
  detail: string;
  tone: 'accent' | 'good';
}) {
  return (
    <div className='flex flex-col gap-1.5'>
      <div className='flex items-center justify-between text-sm'>
        <span className='flex items-center gap-1.5 font-medium'>
          {icon}
          {label}
        </span>
        <span className='text-muted-foreground tabular-nums'>{detail}</span>
      </div>
      <div className='bg-muted h-2.5 w-full overflow-hidden rounded-full'>
        <div
          className={cn('h-full rounded-full transition-all', tone === 'accent' ? 'bg-amber-500' : 'bg-emerald-500')}
          style={{ width: `${Math.max(pct > 0 ? 1 : 0, pct)}%` }}
        />
      </div>
    </div>
  );
}
