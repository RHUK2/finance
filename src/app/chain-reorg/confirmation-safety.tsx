'use client';

import { useMemo, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { ControlSlider, ExplainCard, Metric, SectionIntro } from '@/components/simulation';
import { cn } from '@/lib/utils';
import { CONFIRMATION_PRESETS, doubleSpendProbability, formatProbability } from '@/lib/chain-concept';

export function ConfirmationSafety() {
  const [attackPct, setAttackPct] = useState(10);
  const q = attackPct / 100;

  const current = useMemo(() => doubleSpendProbability(q, 1), [q]);
  const presetRows = useMemo(() => CONFIRMATION_PRESETS.map((z) => ({ z, p: doubleSpendProbability(q, z) })), [q]);

  const [confirmations, setConfirmations] = useState(6);
  const selectedProbability = doubleSpendProbability(q, confirmations);

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='확인 수가 안전의 척도인 이유: 정확한 확률'>
        비트코인 백서 11장의 공식을 그대로 계산한다. 공격자 해시레이트 비중과 확인 수만 정하면, 공격자가 언젠가 정직한
        체인을 따라잡아 그 트랜잭션을 되돌릴 확률이 정확히 나온다. (1블록일 때의 확률: {formatProbability(current)},
        공격자 비중 {attackPct}% 기준)
      </SectionIntro>

      <Card className='flex flex-col gap-4 p-4'>
        <ControlSlider
          label='공격자 해시레이트 비중'
          value={attackPct}
          onChange={setAttackPct}
          min={1}
          max={60}
          step={1}
          format={(v) => `${v}%`}
        />
        <ControlSlider
          label='확인 수'
          value={confirmations}
          onChange={setConfirmations}
          min={1}
          max={30}
          step={1}
          format={(v) => `${v}confirm`}
        />

        <div className='flex items-center gap-2 rounded-md border p-3 text-sm font-medium'>
          <ShieldCheck className='size-4 shrink-0 text-emerald-600 dark:text-emerald-400' />
          확인 {confirmations}개 뒤 이 트랜잭션이 뒤집힐 확률: {formatProbability(selectedProbability)}
        </div>
      </Card>

      <Card className='flex flex-col gap-2 p-4'>
        <span className='text-sm font-medium'>확인 수별 이중지불 성공 확률 (공격자 비중 {attackPct}%)</span>
        <div className='flex flex-col divide-y'>
          {presetRows.map(({ z, p }) => (
            <div key={z} className='flex items-center justify-between py-2 text-sm'>
              <span className='text-muted-foreground'>{z}confirm</span>
              <div className='flex flex-1 items-center gap-2 px-3'>
                <div className='bg-muted h-2 w-full overflow-hidden rounded-full'>
                  <div
                    className={cn(
                      'h-full rounded-full',
                      p > 0.05 ? 'bg-rose-500' : p > 0.001 ? 'bg-amber-500' : 'bg-emerald-500',
                    )}
                    style={{ width: `${Math.max(1, Math.min(100, p * 100))}%` }}
                  />
                </div>
              </div>
              <span className='w-28 text-right tabular-nums'>{formatProbability(p)}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
        <Metric label='0확인 (미확정)' value='100%' tone='bad' sub='아직 어느 블록에도 없음' />
        <Metric label='1확인' value={formatProbability(doubleSpendProbability(q, 1))} tone='accent' />
        <Metric label='6확인 (관행)' value={formatProbability(doubleSpendProbability(q, 6))} tone='good' />
      </div>

      <ExplainCard
        title="왜 하필 '6확인'이 관행이 됐을까"
        preview='공격자 비중이 10% 정도로 가정해도 6확인이면 확률이 0.02% 밑으로 떨어진다.'
        body={
          <>
            사토시가 백서에서 예시로 든 공격자 비중 10% 기준, 확인 수를 늘릴수록 확률이 1확인 20.5% → 6확인 0.02%로 뚝
            떨어진다. 거래소나 대형 결제처럼 되돌렸을 때 손해가 큰 곳은 더 많은 확인을 요구하고, 소액 결제는
            0~1확인만으로도 실무적으로 받아들여진다. &#39;안전&#39;은 고정된 숫자가 아니라{' '}
            <b>거래 금액과 공격자가 가질 법한 해시레이트를 놓고 계산하는 확률</b>이다.
          </>
        }
      />
    </div>
  );
}
