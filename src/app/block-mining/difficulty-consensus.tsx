'use client';

import { useState } from 'react';
import { GitFork, Gauge } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ControlSlider, ExplainCard, Metric, SectionIntro } from '@/components/simulation';
import { cn } from '@/lib/utils';
import { retargetMultiplier, TARGET_RETARGET_DAYS } from '@/lib/block-concept';

const FORK_POINT = 4; // 두 체인이 갈라지기 전 공통 블록 수

export function DifficultyConsensus() {
  const [actualDays, setActualDays] = useState(TARGET_RETARGET_DAYS);
  const [chainA, setChainA] = useState(0);
  const [chainB, setChainB] = useState(0);

  const multiplier = retargetMultiplier(actualDays);
  const clampedHigh = multiplier === 4;
  const clampedLow = multiplier === 0.25;
  const avgBlockMin = (actualDays * 24 * 60) / 2016;

  const lenA = FORK_POINT + chainA;
  const lenB = FORK_POINT + chainB;
  const winner = lenA === lenB ? null : lenA > lenB ? 'A' : 'B';

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='난이도는 스스로 조절된다'>
        채굴기가 늘어나 해시레이트가 오르면 블록이 목표(10분)보다 빨리 나오고, 줄어들면 느려진다. 비트코인은
        2,016블록(약 2주)마다 실제 걸린 시간을 확인해 난이도를 자동으로 고쳐 쓴다. 실제 걸린 기간을 바꿔가며 난이도가
        어떻게 반응하는지 보자.
      </SectionIntro>

      <Card className='gap-4 p-4'>
        <ControlSlider
          icon={<Gauge className='size-4 text-amber-600 dark:text-amber-400' />}
          label='지난 2,016블록이 실제로 걸린 기간'
          hint={`목표 기간은 ${TARGET_RETARGET_DAYS}일(2,016블록 × 10분). 더 빨리 끝났으면 해시레이트가 늘어난 것, 더 걸렸으면 줄어든 것이다.`}
          value={actualDays}
          onChange={setActualDays}
          min={4}
          max={40}
          step={1}
          format={(v) => `${v}일`}
        />

        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
          <Metric label='목표 평균 블록 시간' value='10.0분' />
          <Metric
            label='실제 평균 블록 시간'
            value={`${avgBlockMin.toFixed(1)}분`}
            tone={avgBlockMin < 10 ? 'bad' : avgBlockMin > 10 ? 'accent' : undefined}
          />
          <Metric
            label='새 난이도 배율'
            value={`× ${multiplier.toFixed(2)}`}
            tone={multiplier > 1 ? 'bad' : multiplier < 1 ? 'good' : 'accent'}
          />
        </div>

        {(clampedHigh || clampedLow) && (
          <p className='text-muted-foreground text-xs'>
            배율이 {clampedHigh ? '상한 4배' : '하한 0.25배'}에 걸렸다. 실제 변동이 이보다 커도 프로토콜은 한 번에 이
            이상 조정하지 않는다.
          </p>
        )}
      </Card>

      <ExplainCard
        title='왜 4배로 조정 폭을 제한할까'
        preview='해시레이트가 순간적으로 널뛰어도 난이도가 한 번에 폭주하지 않도록 완충하는 안전장치.'
        body={
          <>
            해시레이트가 한 조정 주기 사이에 갑자기 폭등하거나 폭락할 수도 있다. 제한이 없다면 난이도가 그 순간 값을
            그대로 따라가며 다음 2주도 극단적으로 흔들릴 수 있다. ±4배 상하한은 이런 극단값의 영향을 완충해, 난이도가
            실제 채굴 참여 수준에 맞춰 몇 주에 걸쳐 서서히 수렴하도록 만드는 안전장치다.
          </>
        }
      />

      <SectionIntro title='합의: 가장 긴(작업량이 가장 많은) 체인이 이긴다'>
        두 채굴자가 거의 동시에 다른 블록을 찾으면 체인이 잠깐 갈라질 수 있다(포크). 노드들은 어느 쪽이 &#39;맞는지&#39;
        투표하지 않는다. 그냥 각자 먼저 본 체인을 따르다가, 한쪽이 다음 블록으로 더 길어지는 순간 전부 그쪽으로
        갈아탄다. 아래에서 양쪽 체인에 블록을 추가하며 확인해 보자.
      </SectionIntro>

      <Card className='flex flex-col gap-4 p-4'>
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
          <ForkBranch id='A' label='체인 A' length={lenA} winner={winner} onMine={() => setChainA((c) => c + 1)} />
          <ForkBranch id='B' label='체인 B' length={lenB} winner={winner} onMine={() => setChainB((c) => c + 1)} />
        </div>

        <div className='flex items-center justify-between border-t pt-3'>
          <span className='text-muted-foreground flex items-center gap-1.5 text-sm'>
            <GitFork className='size-4' />
            {winner
              ? `노드는 ${winner === 'A' ? '체인 A' : '체인 B'}를 따른다. 나머지 체인의 블록은 고아 블록이 된다.`
              : '동률이다. 다음 블록을 찾는 쪽이 승부를 가른다.'}
          </span>
          <Button
            size='sm'
            variant='outline'
            onClick={() => {
              setChainA(0);
              setChainB(0);
            }}
          >
            리셋
          </Button>
        </div>
      </Card>

      <ExplainCard
        title="정확히는 '가장 긴' 체인이 아니라 '누적 작업량이 가장 많은' 체인"
        preview='난이도가 중간에 바뀌면 블록 수가 같아도 각 체인이 담은 작업량은 다를 수 있다.'
        body={
          <>
            난이도가 늘 일정하다면 블록이 많은 쪽 = 작업량이 많은 쪽이라 &#39;가장 긴 체인&#39;이라는 표현이 통한다.
            하지만 실제로 노드가 비교하는 건 블록 개수가 아니라 각 블록의 난이도를 모두 더한 <b>누적 작업량</b>이다.
            이번 시연은 난이도가 같다고 가정해 블록 수 = 작업량으로 단순화했다.
          </>
        }
      />
    </div>
  );
}

function ForkBranch({
  id,
  label,
  length,
  winner,
  onMine,
}: {
  id: 'A' | 'B';
  label: string;
  length: number;
  winner: 'A' | 'B' | null;
  onMine: () => void;
}) {
  const isWinner = winner === id;
  const isOrphan = winner !== null && winner !== id;
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-md border p-3',
        isWinner && 'border-emerald-500/40 bg-emerald-500/5',
        isOrphan && 'border-transparent opacity-50',
        !isWinner && !isOrphan && 'bg-muted border-transparent',
      )}
    >
      <div className='flex items-center justify-between'>
        <span className='text-sm font-medium'>{label}</span>
        <span className='text-muted-foreground text-xs tabular-nums'>블록 {length}개</span>
      </div>
      <div className='flex flex-wrap gap-1'>
        {Array.from({ length }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'size-4 rounded-[3px]',
              i < FORK_POINT
                ? 'bg-muted-foreground/40'
                : isWinner
                  ? 'bg-emerald-500'
                  : isOrphan
                    ? 'bg-muted-foreground/20'
                    : 'bg-amber-500',
            )}
          />
        ))}
      </div>
      <Button size='sm' variant='outline' onClick={onMine}>
        {label}에 블록 추가
      </Button>
    </div>
  );
}
