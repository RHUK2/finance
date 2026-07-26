'use client';

import { useState } from 'react';

import { ArrowDownRight, ArrowUpRight, Building2, Layers, Percent, TrendingUp } from 'lucide-react';

import { ControlSlider, CostBar, ExplainCard, Metric, SectionIntro, StatusBanner } from '@/components/simulation';
import { Card } from '@/components/ui/card';

const fmtEok = (n: number) => `${n.toFixed(1)}억`;
const fmtPct = (n: number) => `${n.toFixed(1)}%`;
const fmtSigned = (n: number) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(1)}억`;

export function GapInvestment() {
  const [price, setPrice] = useState(6);
  const [ratio, setRatio] = useState(70);
  const [change, setChange] = useState(10);

  const deposit = (price * ratio) / 100;
  const gap = price - deposit;
  const leverage = gap > 0 ? price / gap : Infinity;
  const newPrice = price * (1 + change / 100);
  const profit = newPrice - price;
  const roe = gap > 0 ? (profit / gap) * 100 : 0;
  const barMax = Math.max(price, 1);

  const banner =
    profit >= 0
      ? {
          tone: 'good' as const,
          icon: <ArrowUpRight className='size-4 shrink-0' />,
          text: `집값이 ${fmtPct(change)} 오르는 동안 자기 돈 ${fmtEok(gap)}은 ${fmtPct(roe)} 불었다. 보증금이 이자도 만기도 없는 레버리지로 작동해 수익률을 ${leverage.toFixed(1)}배로 키운다.`,
        }
      : {
          tone: 'bad' as const,
          icon: <ArrowDownRight className='size-4 shrink-0' />,
          text: `집값이 ${fmtPct(Math.abs(change))} 빠지자 자기 돈은 ${fmtPct(roe)} 줄었다. 보증금은 시세와 무관하게 전액 그대로 돌려줘야 하므로 하락은 온전히 자기 자본에서만 깎인다.`,
        };

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='보증금을 지렛대로 쓰면'>
        보증금이 무이자 대출이라면, 그 돈으로 집을 사는 사람이 나오는 것은 자연스러운 귀결이다. 매매가에서 전세보증금을
        뺀 차액만 있으면 소유권이 넘어온다. 이 차액이 갭이고, 갭만 넣어 집을 사는 것이 갭투자다. 이자도 만기 상환도 없는
        대신, 시세가 어떻든 보증금은 전액 그대로 돌려줘야 한다.
      </SectionIntro>

      <Card className='gap-5 p-4'>
        <ControlSlider
          icon={<Building2 className='size-4 text-sky-500' />}
          label='매매가'
          value={price}
          onChange={setPrice}
          min={2}
          max={20}
          step={0.5}
          format={fmtEok}
        />
        <ControlSlider
          icon={<Percent className='size-4 text-emerald-500' />}
          label='전세가율'
          value={ratio}
          onChange={setRatio}
          min={30}
          max={95}
          step={1}
          format={fmtPct}
          hint='매매가 대비 전세가의 비율. 이 값이 높을수록 더 적은 돈으로 집을 살 수 있다.'
        />
        <ControlSlider
          icon={<TrendingUp className='size-4 text-amber-500' />}
          label='1년 뒤 매매가 변동'
          value={change}
          onChange={setChange}
          min={-30}
          max={30}
          step={1}
          format={(v) => `${v > 0 ? '+' : ''}${v.toFixed(0)}%`}
        />
      </Card>

      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <Metric label='전세보증금' value={fmtEok(deposit)} sub='임차인에게 빌린 돈' />
        <Metric label='필요한 자기 돈' value={fmtEok(gap)} sub='매매가 − 보증금' tone='accent' />
        <Metric label='레버리지 배수' value={`${leverage.toFixed(1)}배`} sub='자기 돈 1원이 움직이는 자산' />
        <Metric
          label='자기자본 수익률'
          value={fmtPct(roe)}
          sub={`시세 손익 ${fmtSigned(profit)}`}
          tone={roe >= 0 ? 'good' : 'bad'}
        />
      </div>

      <Card className='gap-4 p-4'>
        <CostBar
          label='임차인이 대는 돈'
          value={deposit}
          max={barMax}
          className='bg-sky-500'
          format={fmtEok}
          sub={`매매가의 ${fmtPct(ratio)}`}
        />
        <CostBar
          label='매수자가 대는 돈'
          value={gap}
          max={barMax}
          className='bg-amber-500'
          format={fmtEok}
          sub='이 돈만으로 소유권이 넘어온다'
        />
        <CostBar
          label='1년 뒤 매매가'
          value={Math.max(0, newPrice)}
          max={Math.max(barMax, newPrice)}
          className={profit >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}
          format={fmtEok}
          sub={`처음 ${fmtEok(price)}에서 ${fmtSigned(profit)}`}
        />
      </Card>

      <StatusBanner tone={banner.tone} icon={banner.icon}>
        {banner.text}
      </StatusBanner>

      <ExplainCard
        icon={<Layers className='size-4 text-amber-500' />}
        title='전세가율이 시장을 밀고 당기는 방식'
        preview='전세가율이 높으면 매수 문턱이 낮아지고, 그 매수가 다시 매매가를 밀어 올린다.'
        body={
          <>
            <p>
              전세가율은 두 방향으로 작동한다. 올라갈 때는 진입 문턱을 낮춘다. 전세가율 60%에서 6억짜리 집을 사려면
              2.4억이 필요하지만 90%면 6천만원이면 된다. 같은 돈으로 여러 채를 살 수 있게 되고, 그 매수세가 매매가를
              다시 밀어 올린다. 전세가율이 높은 지역에서 갭투자가 몰리는 것은 수익률 계산의 결과다.
            </p>
            <p className='mt-2'>
              내려갈 때는 반대다. 전세가율이 높다는 것은 자기 돈이 얇다는 뜻이므로, 시세가 조금만 빠져도 자기 자본이
              먼저 증발한다. 매매가가 전세가 아래로 내려가면 집을 팔아도 보증금을 다 못 돌려주는 상태가 된다. 이때
              위험은 집주인이 아니라 임차인에게 넘어간다. 역전세·깡통전세가 그 지점이다.
            </p>
          </>
        }
      />
    </div>
  );
}
