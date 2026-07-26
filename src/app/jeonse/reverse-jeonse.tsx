'use client';

import { useState } from 'react';

import { Building2, CircleAlert, Percent, ShieldAlert, TrendingDown } from 'lucide-react';

import { ControlSlider, CostBar, ExplainCard, Metric, SectionIntro, StatusBanner } from '@/components/simulation';
import { Card } from '@/components/ui/card';

const fmtEok = (n: number) => `${n.toFixed(1)}억`;
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

export function ReverseJeonse() {
  const [price, setPrice] = useState(6);
  const [ratio, setRatio] = useState(80);
  const [priceDrop, setPriceDrop] = useState(25);
  const [rentDrop, setRentDrop] = useState(20);

  const deposit = (price * ratio) / 100; // 2년 전 계약한 보증금. 시세와 무관하게 전액 반환 대상
  const nowPrice = price * (1 - priceDrop / 100);
  const nowMarketDeposit = deposit * (1 - rentDrop / 100); // 지금 새 임차인에게 받을 수 있는 금액
  const refundGap = Math.max(0, deposit - nowMarketDeposit); // 집주인이 현금으로 메워야 할 차액
  const nowRatio = nowPrice > 0 ? (deposit / nowPrice) * 100 : Infinity;
  const underwater = Math.max(0, deposit - nowPrice); // 집을 팔아도 모자라는 금액
  const barMax = Math.max(price, deposit, 1);

  const banner =
    underwater > 0
      ? {
          tone: 'bad' as const,
          icon: <ShieldAlert className='size-4 shrink-0' />,
          text: `보증금 ${fmtEok(deposit)}이 집값 ${fmtEok(nowPrice)}을 넘어섰다. 집을 팔아 전액을 보증금에 써도 ${fmtEok(underwater)}이 모자란다. 집주인의 자기 자본은 이미 사라졌고, 남은 손실은 임차인 쪽으로 넘어간다.`,
        }
      : refundGap > 0
        ? {
            tone: 'accent' as const,
            icon: <CircleAlert className='size-4 shrink-0' />,
            text: `새 임차인에게 받을 수 있는 돈이 ${fmtEok(nowMarketDeposit)}뿐이라 만기에 ${fmtEok(refundGap)}이 빈다. 집주인이 현금을 넣거나 대출을 일으켜야 하고, 그러지 못하면 만기가 와도 보증금이 나오지 않는다.`,
          }
        : {
            tone: 'good' as const,
            icon: <Building2 className='size-4 shrink-0' />,
            text: `새 임차인이 내는 보증금으로 기존 보증금을 덮을 수 있다. 전세는 이렇게 다음 임차인의 돈으로 앞 임차인에게 돌려주는 방식으로 굴러간다. 이 연결이 끊기는 순간이 역전세다.`,
          };

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='보증금은 시세를 따라 내려오지 않는다'>
        집값과 전세 시세는 떨어져도 이미 계약한 보증금은 계약서에 적힌 금액 그대로다. 만기에 돌려줄 돈은 그대로인데 새로
        받을 수 있는 돈만 줄어들면 그 차액은 집주인이 현금으로 메워야 한다. 이것이 역전세다. 한 걸음 더 나아가 보증금이
        집값 자체를 넘어서면 깡통전세가 된다.
      </SectionIntro>

      <Card className='gap-5 p-4'>
        <ControlSlider
          icon={<Building2 className='size-4 text-sky-500' />}
          label='계약 당시 매매가'
          value={price}
          onChange={setPrice}
          min={2}
          max={20}
          step={0.5}
          format={fmtEok}
        />
        <ControlSlider
          icon={<Percent className='size-4 text-emerald-500' />}
          label='계약 당시 전세가율'
          value={ratio}
          onChange={setRatio}
          min={40}
          max={95}
          step={1}
          format={fmtPct}
          hint={`이 조건에서 계약한 보증금은 ${fmtEok(deposit)}이다. 만기에 돌려줄 금액은 앞으로 무슨 일이 있어도 이 금액이다.`}
        />
        <ControlSlider
          icon={<TrendingDown className='size-4 text-rose-500' />}
          label='매매가 하락률'
          value={priceDrop}
          onChange={setPriceDrop}
          min={0}
          max={50}
          step={1}
          format={fmtPct}
        />
        <ControlSlider
          icon={<TrendingDown className='size-4 text-amber-500' />}
          label='전세 시세 하락률'
          value={rentDrop}
          onChange={setRentDrop}
          min={0}
          max={50}
          step={1}
          format={fmtPct}
          hint='지금 새 임차인을 구하면 받을 수 있는 보증금이 그만큼 줄어든다.'
        />
      </Card>

      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <Metric label='돌려줘야 할 보증금' value={fmtEok(deposit)} sub='계약서에 적힌 금액' />
        <Metric label='새로 받을 수 있는 보증금' value={fmtEok(nowMarketDeposit)} sub='지금 전세 시세' tone='accent' />
        <Metric
          label='집주인이 메워야 할 차액'
          value={fmtEok(refundGap)}
          sub={refundGap > 0 ? '만기에 현금으로 필요하다' : '다음 임차인 돈으로 덮인다'}
          tone={refundGap > 0 ? 'bad' : 'good'}
        />
        <Metric
          label='현재 전세가율'
          value={fmtPct(nowRatio)}
          sub={nowRatio >= 100 ? '깡통전세' : `집값 ${fmtEok(nowPrice)} 대비`}
          tone={nowRatio >= 100 ? 'bad' : nowRatio >= 90 ? 'accent' : 'good'}
        />
      </div>

      <Card className='gap-4 p-4'>
        <CostBar
          label='돌려줘야 할 보증금'
          value={deposit}
          max={barMax}
          className='bg-sky-500'
          format={fmtEok}
          sub='시세가 어떻게 되든 줄지 않는다'
        />
        <CostBar
          label='지금의 집값'
          value={nowPrice}
          max={barMax}
          className={underwater > 0 ? 'bg-rose-500' : 'bg-emerald-500'}
          format={fmtEok}
          sub={`계약 당시 ${fmtEok(price)}에서 ${fmtPct(priceDrop)} 하락`}
        />
        <CostBar
          label='새 임차인에게 받을 수 있는 돈'
          value={nowMarketDeposit}
          max={barMax}
          className='bg-amber-500'
          format={fmtEok}
          sub={refundGap > 0 ? `${fmtEok(refundGap)} 부족` : '기존 보증금을 덮는다'}
        />
      </Card>

      <StatusBanner tone={banner.tone} icon={banner.icon}>
        {banner.text}
      </StatusBanner>

      <ExplainCard
        icon={<ShieldAlert className='size-4 text-rose-500' />}
        title='역전세와 깡통전세는 다른 문제다'
        preview='앞은 집주인의 현금 문제, 뒤는 집의 가치 문제다.'
        body={
          <>
            <p>
              역전세는 유동성 문제다. 집값이 보증금보다 높아도 당장 새 임차인에게 받을 돈이 모자라면 만기에 돈이 나오지
              않는다. 집주인이 대출을 받거나 집을 팔면 해결되므로 시간이 있으면 풀린다. 반면 깡통전세는 자산이 부족한
              상태다. 집을 팔아 전액을 보증금에 넣어도 모자라기 때문에 시간이 지나도 그 자체로는 메워지지 않는다.
            </p>
            <p className='mt-2'>
              두 상태 모두 집주인의 자기 자본이 얇을수록 빨리 온다. 전세가율 90%로 산 집은 집값이 10%만 빠져도 깡통이
              된다. 그리고 이런 계약은 대개 한 채로 끝나지 않는다. 여러 채를 같은 방식으로 굴리던 사람이 한 곳에서
              막히면 나머지도 연쇄로 막힌다.
            </p>
            <p className='mt-2'>
              임차인 입장에서 확인할 수 있는 것은 계약 전 두 가지다. 등기부등본의 선순위 근저당 금액, 그리고 보증금과 그
              근저당을 더한 값이 시세에서 차지하는 비중이다. 이 합이 시세에 가까울수록 경매로 갔을 때 돌려받지 못할 몫이
              커진다.
            </p>
          </>
        }
      />
    </div>
  );
}
