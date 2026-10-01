'use client';

import { useMemo, useState } from 'react';
import { ShieldCheck, TriangleAlert } from 'lucide-react';

import { Panel } from '@/components/panel';
import { ControlSlider, ExplainCard, Metric, SectionIntro, StatusBanner } from '@/components/simulation';
import { cn, formatPct } from '@/lib/utils';
import { CONFIRMATION_PRESETS, formatProbability, reversalProbability } from '@/lib/chain-concept';

// 백서가 예시로 든 공격자 비중. 설명 카드의 수치는 이 값에서 계산해 문구와 모델이 갈리지 않게 한다.
const PAPER_Q = 0.1;
// 확인 수 기준이다. 확인 2개 = 백서 z = 1, 확인 6개 = z = 5.
const PAPER_P2 = reversalProbability(PAPER_Q, 2);
const PAPER_P6 = reversalProbability(PAPER_Q, 6);

// 1% 경계는 아래 StatusBanner와 같다. 확률이 커지면 Metric도 함께 나빠진다.
const probabilityTone = (p: number) => (p >= 0.01 ? 'bad' : 'good');

export function ConfirmationSafety() {
  const [attackPct, setAttackPct] = useState(10);
  const q = attackPct / 100;

  const atOne = reversalProbability(q, 1);
  const atSix = reversalProbability(q, 6);
  const presetRows = useMemo(() => CONFIRMATION_PRESETS.map((n) => ({ n, p: reversalProbability(q, n) })), [q]);

  const [confirmations, setConfirmations] = useState(6);
  const selectedProbability = reversalProbability(q, confirmations);
  const reversalLikely = selectedProbability >= 0.01;

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='확인 수가 안전의 척도인 이유: 정확한 확률'>
        비트코인 백서 11장의 공식을 그대로 계산한다. 공격자 해시레이트 비중과 확인 수만 정하면, 공격자가 언젠가 정직한
        체인을 따라잡아 그 트랜잭션을 되돌릴 확률이 정확히 나온다. 트랜잭션이 담긴 블록을 확인 1개로 세고, 백서 공식의
        z는 그 뒤에 이어진 블록 수라 확인 수 − 1이다.
      </SectionIntro>

      <Panel>
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
          format={(v) => `확인 ${v}개`}
        />

        {/*
          tone의 경계는 1%다. formatProbability가 그 선에서 표기를 %에서 "약 N분의 1"로
          바꾸므로, 색과 숫자 모양이 같은 지점에서 함께 넘어간다. 새 임계값을 세우지 않는다.
        */}
        <StatusBanner
          tone={reversalLikely ? 'bad' : 'good'}
          icon={
            reversalLikely ? (
              <TriangleAlert className='size-4 shrink-0 text-bad' />
            ) : (
              <ShieldCheck className='size-4 shrink-0 text-good' />
            )
          }
        >
          확인 {confirmations}개 뒤 이 트랜잭션이 뒤집힐 확률: {formatProbability(selectedProbability)}
        </StatusBanner>
      </Panel>

      <Panel className='gap-2'>
        <span className='text-sm font-medium'>확인 수별 이중지불 성공 확률 (공격자 비중 {attackPct}%)</span>
        <div className='flex flex-col divide-y'>
          {presetRows.map(({ n, p }) => (
            <div key={n} className='flex items-center justify-between py-2 text-sm'>
              <span className='text-muted-foreground'>확인 {n}개</span>
              <div className='flex flex-1 items-center gap-2 px-3'>
                <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
                  <div
                    className={cn(
                      'h-full rounded-full',
                      p > 0.05 ? 'bg-bad-surface' : p > 0.001 ? 'bg-warn-surface' : 'bg-good-surface',
                    )}
                    style={{ width: `${Math.max(1, Math.min(100, p * 100))}%` }}
                  />
                </div>
              </div>
              <span className='w-28 text-right tabular-nums'>{formatProbability(p)}</span>
            </div>
          ))}
        </div>
      </Panel>

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
        <Metric label='확인 0개 (미확정)' value='100%' tone='bad' sub='아직 어느 블록에도 없음' />
        <Metric
          label='확인 1개'
          value={formatProbability(atOne)}
          tone={probabilityTone(atOne)}
          sub='z = 0. 담긴 블록 뒤에 쌓인 블록이 없다'
        />
        <Metric label='확인 6개 (관행)' value={formatProbability(atSix)} tone={probabilityTone(atSix)} sub='z = 5' />
      </div>

      <ExplainCard
        title='왜 하필 확인 6개가 관행이 됐을까'
        preview={`공격자 비중을 ${formatPct(PAPER_Q * 100, 0)}로 가정하면 확인 6개에서 확률이 약 ${formatPct(PAPER_P6 * 100, 3)}(${formatProbability(PAPER_P6)})로 떨어진다.`}
        body={
          <>
            사토시가 백서에서 예시로 든 공격자 비중 {formatPct(PAPER_Q * 100, 0)} 기준, 확인 수를 늘릴수록 확률이 확인
            2개 {formatProbability(PAPER_P2)} → 확인 6개 약 {formatPct(PAPER_P6 * 100, 3)}로 뚝 떨어진다. 거래소나 대형
            결제처럼 되돌렸을 때 손해가 큰 곳은 더 많은 확인을 요구하고, 소액 결제는 확인 0~1개만으로도 실무적으로
            받아들여진다. &#39;안전&#39;은 고정된 숫자가 아니라{' '}
            <b>거래 금액과 공격자가 가질 법한 해시레이트를 놓고 계산하는 확률</b>이다.
          </>
        }
      />
    </div>
  );
}
