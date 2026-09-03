'use client';

import { Anchor, Flag, ShieldAlert, TrendingDown } from 'lucide-react';

import Link from 'next/link';

import { useState } from 'react';

import { ControlSlider, ExplainCard, Metric, SectionIntro, StackedBar, StatusBanner } from '@/components/simulation';
import { Card } from '@/components/ui/card';

import { KR_RATE, krwChain } from './models';

export function WonPosition() {
  const [usRate, setUsRate] = useState(5.5);
  const [intended, setIntended] = useState(3);

  const c = krwChain(usRate, intended);
  const forcedUp = c.forcedRate - intended;

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='사실상 달러본위제는 매달 내는 이자로 착지한다'>
        앞 탭의 계층 표에서 원화는 신흥국 칸에 있었다. 그 자리가 실제로 무엇을 뜻하는지는 금리로 드러난다. 미국이 금리를
        올리면 한국은 따라 올릴지 말지를 고르는 게 아니라 얼마나 오래 버틸지를 고른다. 버티면 환율이 밀리고, 밀린 환율은
        수입물가로 돌아온다. 아래 두 슬라이더로 그 사슬을 직접 밀어 보자. 전가 계수와 가산폭은 구조를 보여주기 위한
        근사값이고 실제 금리 결정은 이보다 훨씬 많은 것을 본다.
      </SectionIntro>

      <Card className='gap-4 p-4'>
        <ControlSlider
          icon={<Flag className='size-4' />}
          label='미국 기준금리'
          value={usRate}
          onChange={setUsRate}
          min={0}
          max={7}
          step={0.25}
          format={(v) => `${v.toFixed(2)}%`}
          hint='한국이 정할 수 없는 값이다. 이 페이지에서 유일하게 외부에서 주어지는 조건이다.'
        />
        <ControlSlider
          icon={<Anchor className='size-4' />}
          label='한국이 유지하려는 기준금리'
          value={intended}
          onChange={setIntended}
          min={0}
          max={7}
          step={0.25}
          format={(v) => `${v.toFixed(2)}%`}
          hint={`국내 경기만 보면 이 정도가 좋겠다는 값. 금리차가 ${KR_RATE.tolerance.toFixed(1)}%p를 넘어가면 이 값을 지킬 수 없다.`}
        />
      </Card>

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
        <Metric
          label='한미 금리차'
          value={`${c.gap.toFixed(2)}%p`}
          tone={c.holds ? undefined : 'bad'}
          sub={`감내 폭 ${KR_RATE.tolerance.toFixed(1)}%p`}
        />
        <Metric
          label='원화 절하 압력'
          value={`${c.depreciation.toFixed(1)}%`}
          tone={c.depreciation > 6 ? 'bad' : undefined}
          sub='따라 올린 뒤에도 남는 금리차가 환율에 실린다'
        />
        <Metric
          label='수입물가 기여'
          value={`+${c.importInflation.toFixed(2)}%p`}
          sub={`절하분의 ${(KR_RATE.importPassthrough * 100).toFixed(0)}%가 소비자물가로`}
        />
      </div>

      <StatusBanner
        icon={c.holds ? <Anchor className='size-4 shrink-0' /> : <ShieldAlert className='size-4 shrink-0' />}
        tone={c.holds ? 'good' : 'bad'}
      >
        {c.holds
          ? `금리차가 감내 폭 안이라 한국은 원하던 ${intended.toFixed(2)}%를 지킬 수 있다.`
          : `한국은 원하던 ${intended.toFixed(2)}%를 지키지 못하고 ${c.forcedRate.toFixed(2)}%까지 따라 올리게 된다. 국내 경기와 무관하게 ${forcedUp.toFixed(2)}%p가 강제됐다.`}
      </StatusBanner>

      <Card className='gap-3 p-4'>
        <div className='flex items-baseline justify-between'>
          <span className='flex items-center gap-1.5 text-sm font-semibold'>
            <TrendingDown className='text-muted-foreground size-4' />
            국내 대출금리는 무엇으로 이뤄지는가
          </span>
          <span className='text-lg font-semibold tabular-nums'>{c.loanRate.toFixed(2)}%</span>
        </div>
        <StackedBar
          total={c.loanRate}
          segments={[
            { label: `한국이 원하던 기준금리 ${intended.toFixed(2)}%`, value: intended, className: 'bg-sky-500' },
            { label: `달러가 강제한 인상분 ${forcedUp.toFixed(2)}%p`, value: forcedUp, className: 'bg-rose-500' },
            {
              label: `은행 가산폭 ${KR_RATE.spread.value.toFixed(2)}%p`,
              value: KR_RATE.spread.value,
              className: 'bg-muted-foreground/40',
            },
          ]}
        />
        <p className='text-muted-foreground text-xs/relaxed'>
          가산폭 {KR_RATE.spread.value.toFixed(1)}%p는 {KR_RATE.spread.source}의 {KR_RATE.spread.asOf}에서 잡은 값이다.
          이 금리로 매달 얼마를 갚게 되는지는{' '}
          <Link href='/mortgage' className='underline underline-offset-2'>
            주택담보대출
          </Link>{' '}
          페이지가 계산한다.
        </p>
      </Card>

      <ExplainCard
        title='그래서 한국은행은 무엇을 정하는가'
        preview='금리의 수준이 아니라 언제까지 버틸지를 정한다'
        body={
          <div className='flex flex-col gap-2'>
            <p>
              통화정책이 독립적이라는 말은 형식으로는 맞다. 한국은행은 자기 기준금리를 스스로 의결하고 누구의 승인도
              받지 않는다. 그런데 위 슬라이더에서 보이듯 선택지의 폭이 외부 조건으로 좁혀진다.
            </p>
            <p>
              금리차가 벌어지면 자본은 더 높은 이자를 주는 쪽으로 옮겨 가고 원화 수요가 줄어 환율이 밀린다. 밀린 환율은
              에너지와 식료품처럼 안 사고는 못 배기는 품목의 값을 올려 소비자물가로 돌아온다. 그러면 물가를 잡으려고
              금리를 올려야 하는데, 그 인상은 국내 경기가 요구한 게 아니라 밖에서 밀려 들어온 것이다. 위 배너가
              강제됐다고 말하는 게 이 부분이다.
            </p>
            <p>
              반대로 미국이 내리면 여유가 생긴다. 한국이 고를 수 있는 폭은 미국 금리를 중심으로 감내 폭만큼 열리는
              구간이고, 그 구간이 어디에 놓일지는 한국이 정하지 않는다. 통화 계층에서 아래 칸에 있다는 것의 구체적인
              뜻이 이것이다. 정책 수단을 뺏긴 게 아니라 정책 수단이 작동하는 범위가 남이 정한 좌표 위에 놓여 있다.
            </p>
            <p>
              여기서 앞 탭으로 되돌아가면 이탈이라는 말이 왜 그렇게 값비싼 선택인지도 달리 보인다. 이 락인의 대가는 매달
              내는 이자 몇 십 베이시스포인트고, 이탈의 대가는 무역 결제망 전체다. 대부분의 나라에게 계산은 아직 끝나
              있다.
            </p>
          </div>
        }
      />
    </div>
  );
}
