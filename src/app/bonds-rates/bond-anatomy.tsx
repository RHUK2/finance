'use client';

import { useState } from 'react';

import { ArrowDownRight, ArrowUpRight, CalendarClock, Coins, Equal, Percent } from 'lucide-react';

import { ControlSlider, ExplainCard, Metric, SectionIntro, StackedBar, StatusBanner } from '@/components/simulation';
import { Panel } from '@/components/panel';

import { bondPrice, type Bond } from './models';

const FACE = 1_000_000;

const fmtWon = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}원`;
const fmtPct = (n: number) => `${(n * 100).toFixed(2)}%`;

export function BondAnatomy() {
  const [couponRate, setCouponRate] = useState(0.03);
  const [years, setYears] = useState(10);
  const [ytm, setYtm] = useState(0.03);

  const bond: Bond = { face: FACE, couponRate, years, ytm };
  const price = bondPrice(bond);
  const coupon = FACE * couponRate;

  // 가격을 '이자의 현재가치'와 '원금의 현재가치' 둘로 갈라 보인다. 만기가 길수록
  // 앞쪽이 커지고, 할인율이 높을수록 뒤쪽이 쪼그라든다.
  const principalPv = FACE / (1 + ytm) ** years;
  const couponPv = price - principalPv;

  const gapPct = (price / FACE - 1) * 100;
  const state = Math.abs(gapPct) < 0.05 ? 'par' : gapPct > 0 ? 'premium' : 'discount';

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='채권은 미래의 현금흐름을 지금 사는 일이다'>
        채권 한 장은 약속의 묶음이다. 해마다 정해진 이자를 주고 만기에 원금을 돌려준다는 약속이고, 그 약속의 내용은 발행
        때 못 박혀 바뀌지 않는다. 바뀌는 것은 그 약속에 시장이 매기는 값뿐이다. 아래 세 손잡이 중 앞의 둘은 약속의
        내용이고, 마지막 하나는 시장이 요구하는 수익률이다. 그것만 움직여 보면 가격이 왜 금리와 반대로 가는지 한눈에
        보인다.
      </SectionIntro>

      <Panel>
        <ControlSlider
          icon={<Percent className='size-4 text-emerald-500' />}
          label='표면금리 (약속된 이자)'
          value={couponRate}
          onChange={setCouponRate}
          min={0}
          max={0.1}
          step={0.005}
          format={fmtPct}
          hint={`해마다 ${fmtWon(coupon)}을 받는다. 발행 뒤에는 바뀌지 않는다.`}
        />
        <ControlSlider
          icon={<CalendarClock className='size-4 text-sky-500' />}
          label='잔존 만기'
          value={years}
          onChange={setYears}
          min={1}
          max={30}
          step={1}
          format={(v) => `${v}년`}
        />
        <ControlSlider
          icon={<Coins className='size-4 text-amber-500' />}
          label='시장 요구수익률 (만기수익률)'
          value={ytm}
          onChange={setYtm}
          min={0.001}
          max={0.12}
          step={0.001}
          format={fmtPct}
          hint='시장이 이 정도 위험에 요구하는 수익률이다. 이것만이 날마다 움직인다.'
        />
      </Panel>

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
        <Metric
          label='채권 가격'
          value={fmtWon(price)}
          tone={state === 'par' ? undefined : state === 'premium' ? 'good' : 'bad'}
          sub={
            state === 'par'
              ? `액면 ${fmtWon(FACE)}과 같음`
              : `액면 대비 ${gapPct >= 0 ? '+' : '−'}${Math.abs(gapPct).toFixed(1)}%`
          }
        />
        <Metric label='연 이자' value={fmtWon(coupon)} sub={`표면금리 ${fmtPct(couponRate)}`} />
        <Metric label='받는 이자 총액' value={fmtWon(coupon * years)} sub={`${years}년 동안 · 할인 전 금액`} />
      </div>

      <StatusBanner
        tone={state === 'par' ? undefined : state === 'premium' ? 'good' : 'bad'}
        icon={
          state === 'par' ? (
            <Equal className='size-4 shrink-0' />
          ) : state === 'premium' ? (
            <ArrowUpRight className='size-4 shrink-0' />
          ) : (
            <ArrowDownRight className='size-4 shrink-0' />
          )
        }
      >
        <span className='leading-relaxed font-normal'>
          {state === 'par'
            ? '표면금리와 시장금리가 같다. 이때만 가격이 액면과 일치한다(액면 발행).'
            : state === 'premium'
              ? '표면금리가 시장금리보다 높다. 남들보다 이자를 더 주는 약속이니 액면보다 비싸게 팔린다(할증).'
              : '표면금리가 시장금리보다 낮다. 남들보다 이자를 덜 주는 약속이니 그만큼 싸게 팔려야 팔린다(할인).'}
        </span>
      </StatusBanner>

      <Panel className='gap-3'>
        <div className='flex items-baseline justify-between'>
          <span className='text-sm font-medium'>가격은 무엇의 합인가</span>
          <span className='text-xs text-muted-foreground tabular-nums'>{fmtWon(price)}</span>
        </div>
        <StackedBar
          segments={[
            { label: `이자의 현재가치 ${fmtWon(couponPv)}`, value: couponPv, className: 'bg-emerald-500' },
            { label: `원금의 현재가치 ${fmtWon(principalPv)}`, value: principalPv, className: 'bg-sky-500' },
          ]}
          total={price}
        />
        <p className='text-xs text-muted-foreground'>
          만기가 멀수록 원금은 더 깊이 할인돼 오른쪽 몫이 줄고, 그 자리를 해마다 받는 이자가 메운다. 다음 탭의
          듀레이션은 바로 이 두 몫의 무게중심이 언제냐를 재는 값이다.
        </p>
      </Panel>

      <ExplainCard
        icon={<Coins className='size-4 text-amber-500' />}
        title='왜 금리가 오르면 가격이 떨어지나'
        preview='내 채권의 이자는 고정인데, 새로 나온 채권이 더 준다면 내 것은 깎여야 팔린다.'
        body='표면금리 3%짜리를 들고 있는데 시장금리가 5%로 올랐다고 하자. 지금 새로 발행되는 채권은 5%를 준다. 아무도 3%짜리를 액면가에 사 주지 않는다. 팔리려면 값이 깎여야 하고, 깎인 값으로 사서 만기에 액면을 돌려받는 차익까지 더했을 때 수익률이 5%에 맞아떨어지는 지점이 곧 지금의 가격이다. 금리와 가격이 반대로 움직이는 것은 시장의 심리가 아니라 이 산수의 결과다.'
      />
      <ExplainCard
        icon={<Percent className='size-4 text-emerald-500' />}
        title='표면금리와 만기수익률은 다른 숫자다'
        preview='앞은 발행 때 못 박힌 약속, 뒤는 오늘 이 값에 사면 만기까지 얼마를 버는가.'
        body='표면금리(쿠폰)는 액면 대비 해마다 주는 이자의 비율로, 발행 때 정해지고 끝까지 바뀌지 않는다. 만기수익률(YTM)은 오늘의 시장가격에 사서 만기까지 들고 갔을 때의 연평균 수익률이라, 가격이 움직일 때마다 함께 움직인다. 뉴스에서 "국채 금리가 올랐다"고 할 때의 금리는 언제나 뒤쪽이다. 액면가에 거래될 때만 둘이 같아진다.'
      />
    </div>
  );
}
