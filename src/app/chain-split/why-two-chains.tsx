'use client';

import { useState } from 'react';

import { Gauge, Layers, Radio, TimerOff } from 'lucide-react';

import { ControlSlider, ExplainCard, Metric, SectionIntro, StatusBanner } from '@/components/simulation';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { FACTS, RETARGET_BLOCKS, blockIntervalMinutes, daysToRetarget, formatDuration } from './models';

const SIGNAL_PCT = FACTS.signalingShare.value * 100;

export function WhyTwoChains() {
  // 실제 BIP-110 신호 비율에서 시작한다. 여기가 이 탭이 설명하려는 지점이고,
  // 슬라이더를 오른쪽으로 밀어 보면 왜 이 값이 회복 불능인지가 대비로 드러난다.
  const [hashPct, setHashPct] = useState(SIGNAL_PCT);
  const share = hashPct / 100;
  const interval = blockIntervalMinutes(share);
  const days = daysToRetarget(share);
  // 판정선은 남은 기간이 아니라 블록 간격으로 잡는다. 조정까지 걸리는 날짜로 재면
  // 슬라이더 거의 전 구간이 같은 판정이 되어 대비가 죽는다. 채굴자가 체인에 남을지는
  // 보상이 언제 들어오느냐로 정해지므로 간격이 더 맞는 잣대이기도 하다.
  const stuck = interval > 60;
  const retargetLabel = days > 365 ? `${(days / 365).toFixed(1)}년` : `${Math.round(days)}일`;

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='소프트포크는 체인을 가르지 않는다고 했는데, 왜 갈렸나'>
        소프트포크는 규칙을 좁히기만 하므로 구버전 노드가 신버전 블록을 계속 받아들인다. 그래서 체인이 하나로 남는다는
        것이 교과서적인 설명이다. 그런데 BIP-110에서는 갈렸다. 좁힌 쪽이 소수였기 때문이 아니라, 좁힌 쪽이 신호하지 않는
        블록을 거부하기 시작했기 때문이다. 여기서부터 두 체인이 각자의 과거를 갖는다.
      </SectionIntro>

      <Card className='flex flex-col gap-3 p-4'>
        <span className='flex items-center gap-1.5 text-sm font-medium'>
          <Radio className='size-4 text-sky-600 dark:text-sky-400' />
          mandatory signaling이 하는 일
        </span>
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
          <div className='rounded-md border p-3'>
            <p className='text-sm font-medium'>일반적인 소프트포크</p>
            <p className='text-muted-foreground mt-1 text-sm/relaxed'>
              신규칙 노드는 신규칙을 어긴 <b>트랜잭션</b>만 거부한다. 신호하지 않는 블록이라도 담긴 트랜잭션이 규칙을
              지키면 받아들인다. 그래서 다수 체인을 계속 따라간다.
            </p>
          </div>
          <div className={cn('rounded-md border p-3', 'border-rose-500/40 bg-rose-500/5')}>
            <p className='text-sm font-medium'>mandatory signaling 구간</p>
            <p className='text-muted-foreground mt-1 text-sm/relaxed'>
              신규칙 노드가 신호하지 않는 <b>블록 자체</b>를 거부한다. 다수 채굴자가 신호하지 않으면 그 블록들이 통째로
              버려지고, 신규칙 노드는 자기들끼리의 체인을 따로 잇는다.
            </p>
          </div>
        </div>
        <p className='text-muted-foreground text-sm/relaxed'>
          BIP-110은 {FACTS.signalingHeight.value.toLocaleString()}블록부터 이 구간에 들어갔다. 직전 {RETARGET_BLOCKS}
          블록 중 신호한 블록은 51개, {SIGNAL_PCT.toFixed(2)}%였다. 조기 활성화 임계값은{' '}
          {FACTS.lockInThreshold.value * 100}%다. 활성화에 필요한 지지의 20분의 1도 안 되는 해시레이트가 다수 체인에서
          떨어져 나온 셈이다.
        </p>
      </Card>

      <SectionIntro title='갈라진 소수 체인은 왜 두 블록에서 멈췄나'>
        분기 직후 두 체인은 난이도를 똑같이 물려받는다. 난이도는 {RETARGET_BLOCKS}블록마다 한 번씩만 조정되므로, 소수
        체인은 줄어든 해시레이트로 그 {RETARGET_BLOCKS}블록을 먼저 캐내야 난이도가 내려간다. 아래 슬라이더로 소수 체인이
        가져간 해시레이트 비중을 밀어 보면, 회복 가능한 구간과 사실상 정지하는 구간이 어디서 갈리는지 보인다.
      </SectionIntro>

      <Card className='gap-4 p-4'>
        <ControlSlider
          icon={<Gauge className='size-4 text-amber-500' />}
          label='소수 체인이 가져간 해시레이트 비중'
          hint={`BIP-110 실제 신호 비율은 ${SIGNAL_PCT.toFixed(2)}%였다`}
          value={hashPct}
          onChange={setHashPct}
          min={0.5}
          max={50}
          step={0.5}
          format={(v) => `${v.toFixed(1)}%`}
        />
      </Card>

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
        <Metric
          label='평균 블록 간격'
          value={formatDuration(interval)}
          tone={interval > 60 ? 'bad' : interval > 20 ? 'accent' : 'good'}
          sub='정상은 10분'
        />
        <Metric
          label='다음 난이도 조정까지'
          value={retargetLabel}
          tone={stuck ? 'bad' : 'good'}
          sub={`${RETARGET_BLOCKS.toLocaleString()}블록을 캐야 한다`}
        />
        <Metric label='하루에 나오는 블록' value={`${((60 * 24) / interval).toFixed(1)}개`} sub='정상은 144개' />
      </div>

      <StatusBanner tone={stuck ? 'bad' : 'accent'} icon={<TimerOff className='size-5 shrink-0' />}>
        <div>
          <p className='font-semibold'>
            {stuck ? '난이도가 내려오기 전에 채굴자가 먼저 떠난다' : '느리지만 난이도 조정까지 버틸 만하다'}
          </p>
          <p className='text-muted-foreground mt-0.5 text-xs font-normal'>
            {stuck
              ? `블록 하나에 ${formatDuration(interval)}이 걸리고 조정까지 ${retargetLabel}이 남는다. 그동안 채굴자는 보상을 거의 못 받는데 전기는 계속 쓴다. 남을 이유가 없어서 해시레이트가 더 빠지고, 빠질수록 간격이 더 벌어진다. BIP-110 소수 체인이 두 블록에서 멈춘 것이 이 구간이다.`
              : `블록 하나에 ${formatDuration(interval)}이 걸린다. 정상보다 느리지만 채굴자가 보상을 받으며 버틸 수 있는 간격이라, 조정 시점까지 도달해 체인이 자립할 여지가 있다.`}
          </p>
        </div>
      </StatusBanner>

      <ExplainCard
        icon={<Layers className='size-4 text-violet-500' />}
        title='두 체인의 규칙 집합은 어떻게 겹치는가'
        preview='이 겹침의 모양이 이 페이지 나머지 전부를 결정한다'
        body={
          <div className='flex flex-col gap-3'>
            <p>
              분기 유형은 두 체인의 규칙 집합이 어떤 모양으로 겹치는지로 갈린다. 그리고 그 모양이 다음 탭의 리플레이와
              그 다음 탭의 코인 분리를 전부 결정한다.
            </p>

            <div className='flex flex-col gap-3 sm:flex-row'>
              <div className='flex-1 rounded-md border p-3'>
                <p className='text-sm font-medium'>소프트포크 분기 (BIP-110)</p>
                <div className='my-3 rounded border border-dashed p-3'>
                  <span className='text-muted-foreground text-xs'>기존 규칙에서 유효한 트랜잭션</span>
                  <div className='mt-2 rounded border border-rose-500/50 bg-rose-500/5 p-2'>
                    <span className='text-xs'>BIP-110 규칙에서도 유효</span>
                  </div>
                </div>
                <p className='text-muted-foreground text-sm/relaxed'>
                  좁은 쪽이 넓은 쪽에 통째로 들어간다. 평범한 송금은 두 원 안에 함께 있으므로 양쪽에서 유효하다.
                </p>
              </div>
              <div className='flex-1 rounded-md border p-3'>
                <p className='text-sm font-medium'>하드포크 분기 (eCash)</p>
                <div className='my-3 flex gap-2 rounded border border-dashed p-3'>
                  <div className='flex-1 rounded border border-sky-500/50 bg-sky-500/5 p-2'>
                    <span className='text-xs'>기존 규칙</span>
                  </div>
                  <div className='flex-1 rounded border border-amber-500/50 bg-amber-500/5 p-2'>
                    <span className='text-xs'>eCash 규칙</span>
                  </div>
                </div>
                <p className='text-muted-foreground text-sm/relaxed'>
                  어느 쪽도 상대를 포함하지 않는다. 그래도 과거와 서명 방식을 물려받으면 겹치는 부분이 넓어서, 평범한
                  송금은 역시 양쪽에서 유효하다.
                </p>
              </div>
            </div>

            <p>
              여기서 흔한 오해 하나를 짚어 둔다. 포함 관계가 있으면 리플레이가 한 방향으로만 일어난다고 정리하기 쉬운데,
              그렇지 않다. 평범한 송금 트랜잭션은 좁은 규칙도 넓은 규칙도 만족하므로 어느 쪽에서 서명하든 반대편에서
              유효하다. 포함 관계가 정하는 것은 리플레이 방향이 아니라 <b>분리 방향</b>이다. 좁은 쪽이 거부할 요소를
              일부러 넣어야만 한쪽에서만 유효한 트랜잭션이 되고, 그건 넓은 쪽에서만 가능하다.
            </p>
          </div>
        }
      />
    </div>
  );
}
