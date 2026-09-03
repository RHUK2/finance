'use client';

import Link from 'next/link';

import { useMemo, useState } from 'react';

import { ExplainerPage } from '@/components/explainer-page';
import { ControlSlider, SectionIntro, StatCard, StepPanel } from '@/components/simulation';
import { formatSigned } from '@/lib/utils';

import { AssetEquationCard, BalanceSheet, TrustSection } from './components';
import { ENTITIES, buildSteps, metricsAt, sheetsAt } from './steps';

export function MoneyCreationView() {
  const [step, setStep] = useState(0);
  const [reserveRatio, setReserveRatio] = useState(0.1);

  const steps = useMemo(() => buildSteps(reserveRatio), [reserveRatio]);
  const sheets = useMemo(() => sheetsAt(steps, step), [steps, step]);
  const metrics = useMemo(() => metricsAt(steps, step), [steps, step]);

  const current = steps[step];
  const isMultiplierStep = current.id === 'multiplier';

  const sliderNode = isMultiplierStep ? (
    <div className='rounded-lg border p-3'>
      <ControlSlider
        label='지급준비율'
        value={Math.round(reserveRatio * 100)}
        min={1}
        max={50}
        step={1}
        onChange={(v) => setReserveRatio(v / 100)}
        format={(v) => `${v}%`}
        hint='지급준비율이 낮을수록 통화승수가 커진다 (최대 통화량 = 본원통화 ÷ 지급준비율).'
      />
    </div>
  ) : null;

  return (
    <ExplainerPage
      breadcrumb='신용창조'
      title='돈은 어떻게 무에서 창조되는가'
      intro={
        <>
          정부 · 연준 · 시중은행 · 국민의 대차대조표를 따라가며, 국채 발행부터 신용창조까지 돈이 만들어지는 과정을 한
          단계씩 살펴본다. 여기서 만들어지는 광의통화(M2)가 예금의 구매력을 어떻게 깎는지는{' '}
          <Link href='/inflation' className='underline underline-offset-2'>
            구매력 붕괴
          </Link>{' '}
          페이지에서 이어서 본다. 수치는 개념 이해용 예시다.
        </>
      }
      hideScrollTop
    >
      <SectionIntro title='네 주체의 장부를 동시에 본다'>
        맨 아래 단계 패널을 한 걸음씩 밀면 정부·연준·시중은행·국민의 대차대조표가 함께 바뀐다. 어느 칸이 무에서 새로
        생긴 돈이고 어느 칸이 기존 돈의 이동인지를 색으로 갈라 두었다.
      </SectionIntro>

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
        <StatCard label='본원통화 (M0)' value={metrics.m0} format={formatSigned} tone='accent' />
        <StatCard label='광의통화 (M2)' value={metrics.m2} format={formatSigned} tone='accent' />
        <StatCard label='통화승수' value={metrics.multiplier} format={(n) => `${n.toFixed(1)}배`} />
      </div>

      <div className='text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs'>
        <span className='flex items-center gap-1.5'>
          <span className='size-3 rounded-sm border border-amber-500/70 bg-amber-500/15 ring-1 ring-amber-500/60' />
          무(無)에서 새로 창조
        </span>
        <span className='flex items-center gap-1.5'>
          <span className='size-3 rounded-sm border border-sky-500/70 bg-sky-500/15 ring-1 ring-sky-500/60' />
          기존 돈이 이동·변환
        </span>
      </div>

      <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
        {ENTITIES.map((e) => (
          <BalanceSheet key={e.id} name={e.name} sub={e.sub} sheet={sheets[e.id]} />
        ))}
      </div>

      <AssetEquationCard />

      <SectionIntro title='그렇다면 그 돈은 왜 가치를 가질까'>
        무에서 만들어진 돈이 값을 갖는 이유는 장부 안에 없다.
      </SectionIntro>

      <TrustSection />

      <StepPanel
        step={step}
        total={steps.length}
        title={current.title}
        narration={current.narration}
        onPrev={() => setStep((s) => Math.max(0, s - 1))}
        onNext={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
        onReset={() => setStep(0)}
        onJump={setStep}
        slider={sliderNode}
      />
    </ExplainerPage>
  );
}
