'use client';

import { Landmark, Link2Off, ShieldQuestion } from 'lucide-react';

import { useState } from 'react';

import { ExplainCard, Metric, SectionIntro, StatusBanner, StepPanel } from '@/components/simulation';
import { Card } from '@/components/ui/card';

import { DEMAND_STAGES } from './models';

export function DemandSource() {
  const [step, setStep] = useState(0);
  const stage = DEMAND_STAGES[step];

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='달러를 받아 두는 이유는 세 번 갈아끼워졌다'>
        1971년까지 달러 뒤에는 금이 있었고, 그 뒤로는 아무것도 없다. 그런데도 달러 수요는 줄지 않았다. 담보가 사라졌는데
        수요가 남은 이유를 보려면 담보와 수요원을 갈라 불러야 한다. 담보는 청구하면 실물이 나오는 것이고, 수요원은 그
        통화를 구해야만 하게 만드는 조건이다. 아래 세 단계에서 갈리는 지점이 어디인지 따라가 보자.
      </SectionIntro>

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
        <Metric label='시기' value={stage.era} />
        <Metric label='달러를 받는 이유' value={stage.anchor} />
        <Metric label='그 이유의 성격' value={stage.kind} tone={stage.kind === '담보' ? 'accent' : undefined} />
      </div>

      <StatusBanner
        icon={stage.claimable ? <Landmark className='size-4 shrink-0' /> : <Link2Off className='size-4 shrink-0' />}
        tone={stage.claimable ? 'good' : 'accent'}
      >
        {stage.claimable ? '태환 청구권이 있다. ' : '태환 청구권이 없다. '}
        {stage.claimNote}
      </StatusBanner>

      <Card className='gap-1.5 p-4'>
        <span className='flex items-center gap-1.5 text-sm font-semibold'>
          <ShieldQuestion className='text-muted-foreground size-4' />
          무엇이 이 단계를 끝냈나
        </span>
        <p className='text-muted-foreground text-sm/relaxed'>{stage.broke}</p>
      </Card>

      <ExplainCard
        title='왜 석유를 담보라고 부르면 안 되는가'
        preview='담보라고 부르면 이 페이지의 답이 반대로 나온다'
        body={
          <div className='flex flex-col gap-2'>
            <p>
              흔히 달러가 금 대신 석유를 담보로 삼았다고 쓴다. 편한 비유지만 정확하지 않고, 부정확한 쪽으로 결론을 끌고
              간다.
            </p>
            <p>
              담보에는 청구권이 붙는다. 브레턴우즈 아래에서 각국 중앙은행은 달러를 들고 와 금을 요구할 수 있었고 미국은
              내줘야 했다. 실제로 그 청구가 몰려서 1971년에 체제가 끝났다. 반면 페트로달러에는 청구할 대상이 없다.
              달러를 사우디에 가져가 석유로 바꿔 달라고 할 수 있는 창구는 존재한 적이 없다. 석유가 한 일은 담보가 되는
              게 아니라 결제통화를 고정해 석유를 사려면 달러부터 구하게 만든 것이다.
            </p>
            <p>
              이 구분이 중요한 이유는 결론이 갈리기 때문이다. 담보로 보면 담보가 사라졌으니 곧 무너진다는 결론이 자연히
              따라 나오는데, 실제로는 반세기가 지나도록 무너지지 않았다. 수요원으로 보면 설명이 맞는다. 담보가 없어도
              달러를 구해야 할 이유가 남아 있으면 체제는 유지된다. 그리고 그 이유는 미국이 무엇을 내주는지가 아니라
              남들이 무엇을 쓰는지로 정해지므로, 무너뜨리려면 미국을 압박하는 게 아니라 다른 경로를 만들어야 한다. 다음
              탭이 그 계산이다.
            </p>
          </div>
        }
      />

      <StepPanel
        step={step}
        total={DEMAND_STAGES.length}
        title={stage.title}
        narration={stage.narration}
        onPrev={() => setStep((s) => Math.max(0, s - 1))}
        onNext={() => setStep((s) => Math.min(DEMAND_STAGES.length - 1, s + 1))}
        onReset={() => setStep(0)}
        onJump={setStep}
      />
    </div>
  );
}
