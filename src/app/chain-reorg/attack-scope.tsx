'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CircleCheck, CircleX, TriangleAlert } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { ControlSlider, ExplainCard, Metric, SectionIntro, StatusBanner } from '@/components/simulation';
import { cn } from '@/lib/utils';
import { doubleSpendProbability, formatProbability } from '@/lib/chain-concept';

const EVENTUALLY_Z = 200; // 유한한 확인 수로 "시간이 무한히 지나면"을 근사

const COMPARE_PRESETS = [10, 30, 45, 51, 60] as const;

export function AttackScope() {
  const [attackPct, setAttackPct] = useState(45);
  const q = attackPct / 100;
  const isMajority = q >= 0.5;

  const atSix = doubleSpendProbability(q, 6);
  const eventually = doubleSpendProbability(q, EVENTUALLY_Z);

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='51%의 진짜 의미: 확률이 아니라 시간문제가 된다'>
        해시레이트 비중이 50%를 넘는 순간 질적으로 다른 일이 벌어진다. 51% 미만이면 확인 수를 늘릴수록 따라잡을 확률이
        0에 수렴하지만, 51% 이상이면 확률은 언제나 결국 <b>1</b>이다. 확인을 아무리 많이 쌓아도 &#39;충분히
        안전&#39;해지는 지점이 없고, 그저 시간문제가 된다.
      </SectionIntro>

      <Card className='flex flex-col gap-4 p-4'>
        <ControlSlider
          label='공격자 해시레이트 비중'
          value={attackPct}
          onChange={setAttackPct}
          min={1}
          max={80}
          step={1}
          format={(v) => `${v}%`}
        />

        <StatusBanner
          tone={isMajority ? 'bad' : 'good'}
          icon={
            isMajority ? (
              <TriangleAlert className='size-4 shrink-0 text-rose-600 dark:text-rose-400' />
            ) : (
              <CircleCheck className='size-4 shrink-0 text-emerald-600 dark:text-emerald-400' />
            )
          }
        >
          {isMajority
            ? '과반 해시레이트: 확인을 아무리 쌓아도 확률은 결국 100%로 수렴한다.'
            : '과반 미만: 확인 수를 늘릴수록 확률이 0에 가까워진다.'}
        </StatusBanner>

        <div className='grid grid-cols-2 gap-3'>
          <Metric label='6확인 시 확률' value={formatProbability(atSix)} tone={atSix > 0.05 ? 'bad' : 'good'} />
          <Metric
            label={`${EVENTUALLY_Z}확인 시 확률 ("결국")`}
            value={formatProbability(eventually)}
            tone={isMajority ? 'bad' : 'good'}
          />
        </div>
      </Card>

      <Card className='flex flex-col gap-2 p-4'>
        <span className='text-sm font-medium'>해시레이트 비중별 비교</span>
        <div className='flex flex-col divide-y'>
          {COMPARE_PRESETS.map((pct) => {
            const pq = pct / 100;
            const six = doubleSpendProbability(pq, 6);
            const ev = doubleSpendProbability(pq, EVENTUALLY_Z);
            return (
              <div key={pct} className='flex items-center justify-between gap-3 py-2 text-sm'>
                <span className={cn('w-14 font-medium', pct >= 51 && 'text-rose-600 dark:text-rose-400')}>{pct}%</span>
                <span className='text-muted-foreground flex-1'>6확인: {formatProbability(six)}</span>
                <span className={cn('w-32 text-right tabular-nums', pq >= 0.5 ? 'text-rose-500' : 'text-emerald-500')}>
                  결국: {formatProbability(ev)}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <ExplainCard
        icon={<CircleX className='size-4 text-rose-500' />}
        title='과반 공격자도 할 수 없는 것'
        preview='남의 서명을 위조하거나, 없는 코인을 만들거나, 아주 오래된 과거를 통째로 새로 쓸 수는 없다.'
        body={
          <>
            51% 공격이 뒤집을 수 있는 건 <b>공격자 자신이 최근에 보낸 트랜잭션</b>뿐이다. 다음은 해시레이트를 아무리
            쥐어도 불가능하다.
            <ul className='mt-2 list-disc space-y-1 pl-5'>
              <li>다른 사람의 개인키 없이 그 사람 몫의 코인을 자기 것으로 옮기기(서명 위조는 별개의 암호학 문제)</li>
              <li>발행 상한을 넘겨 새 코인을 만들어내기(모든 노드가 블록 보상 규칙을 독립적으로 검증한다)</li>
              <li>
                이미 수십·수백 확인이 쌓인 아주 오래된 과거를 재작성하기. 이론적으로는 가능하지만, 그 지점부터
                현재까지의 누적 작업량을 혼자 힘으로 다시 해내야 해서 51%로도 사실상 불가능에 가깝다
              </li>
            </ul>
            <br />
            그리고{' '}
            <Link href='/bitcoin-game-theory' className='underline underline-offset-2'>
              비트코인 게임이론
            </Link>{' '}
            페이지에서 봤듯, 과반 해시레이트를 갖출 정도의 투자자는 이미 네트워크 최대 이해관계자라 공격으로 얻는
            이득보다 신뢰 붕괴로 잃는 게 훨씬 크다. 여기서 다룬 확률은 &#39;기술적으로 가능한가&#39;일 뿐,
            &#39;경제적으로 해볼 만한가&#39;는 별개의 질문이다.
          </>
        }
      />
    </div>
  );
}
