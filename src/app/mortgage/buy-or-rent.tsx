'use client';

import { useMemo, useState } from 'react';

import { ArrowLeftRight, CalendarClock, House, KeyRound, Percent, Repeat, TrendingUp } from 'lucide-react';

import { ControlSlider, CostBar, ExplainCard, Metric, SectionIntro, StatusBanner } from '@/components/simulation';
import { Card } from '@/components/ui/card';
import { schedule } from '@/lib/mortgage';

// 금액 단위는 만원. 비교를 단순하게 하려고 조달 조건 몇 가지는 고정한다.
const LOAN_RATIO = 60; // 집값 대비 대출 비중
const LOAN_TERM = 30;
const DEPOSIT_RATE = 3; // 묶인 돈을 예금에 뒀다면 받았을 이자
const ACQUISITION_TAX = 1.1; // 취득세율
const HOLDING_TAX = 0.15; // 연 보유세율
const MONTHLY_DEPOSIT_RATIO = 10; // 월세 보증금은 전세 보증금의 이 비율

const fmtEok = (n: number) => `${(n / 10000).toFixed(2)}억`;
const fmtMan = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}만원`;

export function BuyOrRent() {
  const [price, setPrice] = useState(80000);
  const [years, setYears] = useState(8);
  const [growth, setGrowth] = useState(2);
  const [rate, setRate] = useState(4);
  const [jeonseRatio, setJeonseRatio] = useState(65);
  const [convRate, setConvRate] = useState(5.5);

  const loan = (price * LOAN_RATIO) / 100;
  const equity = price - loan;

  // 보유 기간 동안 실제로 낸 이자만 비용으로 본다. 갚은 원금은 자산으로 남는다.
  // 상환표는 만기가 고정이라 거주 기간과 무관하다. 누적 이자만 미리 쌓아 두고 기간으로 꺼내 쓴다.
  const cumInterest = useMemo(() => {
    const out = [0];
    for (const r of schedule(loan, rate, LOAN_TERM, 'equal-payment')) out.push(out[out.length - 1] + r.interest);
    return out;
  }, [loan, rate]);

  const interest = cumInterest[years * 12];

  const acqTax = (price * ACQUISITION_TAX) / 100;
  const holdTax = ((price * HOLDING_TAX) / 100) * years;
  const buyOpportunity = ((equity * DEPOSIT_RATE) / 100) * years;
  const buyFixed = interest + acqTax + holdTax + buyOpportunity;

  const priceGain = price * ((1 + growth / 100) ** years - 1);
  const buyCost = buyFixed - priceGain;

  const deposit = (price * jeonseRatio) / 100;
  const jeonseCost = ((deposit * DEPOSIT_RATE) / 100) * years;

  const monthlyDeposit = (deposit * MONTHLY_DEPOSIT_RATIO) / 100;
  const monthlyRent = ((deposit - monthlyDeposit) * convRate) / 100 / 12;
  const rentCost = monthlyRent * 12 * years + ((monthlyDeposit * DEPOSIT_RATE) / 100) * years;

  // 매수가 전세보다 싸지려면 집값이 해마다 얼마나 올라야 하는가.
  // buyFixed - price*((1+g)^years - 1) = jeonseCost 를 g에 대해 푼다.
  // 필요한 상승분이 집값 전체보다 크면 어떤 상승률로도 따라잡을 수 없다.
  const ratio = 1 + (buyFixed - jeonseCost) / price;
  const breakeven = ratio <= 0 ? null : (ratio ** (1 / years) - 1) * 100;

  const options = [
    { id: 'buy', label: '매수', cost: buyCost, className: 'bg-sky-500' },
    { id: 'jeonse', label: '전세', cost: jeonseCost, className: 'bg-emerald-500' },
    { id: 'rent', label: '월세', cost: rentCost, className: 'bg-amber-500' },
  ];
  const cheapest = options.reduce((a, b) => (b.cost < a.cost ? b : a));
  const barMax = Math.max(...options.map((o) => Math.abs(o.cost)), 1);

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='사느냐 빌리느냐'>
        셋 다 같은 집에 사는 방법이지만 돈이 나가는 자리가 다르다. 매수는 이자와 세금을 내고 집값 변동을 떠안는다.
        전세는 목돈을 묶어 두는 대신 그 돈이 벌 수 있었던 이자를 포기한다. 월세는 묶는 돈이 적은 대신 매달 임대료를
        낸다. 같은 기간 동안 실제로 사라지는 돈이 얼마인지 나란히 놓고 보자.
      </SectionIntro>

      <Card className='gap-5 p-4'>
        <ControlSlider
          icon={<House className='size-4 text-sky-500' />}
          label='집값'
          value={price}
          onChange={setPrice}
          min={30000}
          max={200000}
          step={1000}
          format={fmtEok}
          hint={`매수하면 ${LOAN_RATIO}%인 ${fmtEok(loan)}을 ${LOAN_TERM}년 원리금균등으로 빌리고 ${fmtEok(equity)}을 자기 돈으로 넣는다고 본다.`}
        />
        <ControlSlider
          icon={<CalendarClock className='size-4 text-violet-500' />}
          label='거주 기간'
          value={years}
          onChange={setYears}
          min={2}
          max={20}
          step={1}
          format={(v) => `${v}년`}
          hint='취득세는 한 번만 내므로 오래 살수록 매수 쪽에 유리하게 분산된다.'
        />
        <ControlSlider
          icon={<TrendingUp className='size-4 text-emerald-500' />}
          label='집값 상승률'
          value={growth}
          onChange={setGrowth}
          min={-3}
          max={8}
          step={0.5}
          format={(v) => `연 ${v.toFixed(1)}%`}
          hint='매수와 임차를 가르는 가장 큰 변수이자, 유일하게 미리 알 수 없는 변수다.'
        />
        <ControlSlider
          icon={<Percent className='size-4 text-rose-500' />}
          label='대출 금리'
          value={rate}
          onChange={setRate}
          min={2.5}
          max={7}
          step={0.1}
          format={(v) => `${v.toFixed(1)}%`}
        />
        <ControlSlider
          icon={<KeyRound className='size-4 text-emerald-500' />}
          label='전세가율'
          value={jeonseRatio}
          onChange={setJeonseRatio}
          min={40}
          max={90}
          step={5}
          format={(v) => `${v}%`}
          hint={`전세 보증금 ${fmtEok(deposit)}. 전세대출 없이 자기 돈으로 넣는다고 본다.`}
        />
        <ControlSlider
          icon={<Repeat className='size-4 text-amber-500' />}
          label='전월세전환율'
          value={convRate}
          onChange={setConvRate}
          min={3}
          max={9}
          step={0.5}
          format={(v) => `${v.toFixed(1)}%`}
          hint={`보증금을 월세로 바꿀 때 적용하는 비율. 보증금 ${fmtEok(monthlyDeposit)}에 월세 ${fmtMan(monthlyRent)}이 된다.`}
        />
      </Card>

      <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
        {options.map((o) => (
          <Metric
            key={o.id}
            label={`${o.label} ${years}년 총비용`}
            value={fmtEok(o.cost)}
            tone={o.id === cheapest.id ? 'good' : undefined}
            sub={
              o.id === 'buy'
                ? `집값 변동 ${priceGain >= 0 ? '+' : ''}${fmtEok(priceGain)} 반영`
                : o.id === 'jeonse'
                  ? '묶인 보증금의 기회비용'
                  : `월세 ${fmtMan(monthlyRent)} 기준`
            }
          />
        ))}
      </div>

      <Card className='gap-4 p-4'>
        <span className='text-muted-foreground text-xs'>
          {years}년 동안 실제로 사라지는 돈. 음수는 집값 상승분이 비용을 넘어 이득이 남았다는 뜻이다
        </span>
        {options.map((o) => (
          <CostBar
            key={o.id}
            label={o.label}
            value={Math.abs(o.cost)}
            max={barMax}
            className={o.className}
            format={(v) => (o.cost < 0 ? `-${fmtEok(v)}` : fmtEok(v))}
            sub={
              o.id === 'buy'
                ? `이자 ${fmtEok(interest)}, 세금 ${fmtEok(acqTax + holdTax)}, 자기자본 기회비용 ${fmtEok(buyOpportunity)}`
                : o.id === 'jeonse'
                  ? `보증금 ${fmtEok(deposit)}을 예금에 뒀다면 받았을 이자`
                  : `월세 ${fmtEok(monthlyRent * 12 * years)} + 보증금 기회비용`
            }
          />
        ))}
      </Card>

      <StatusBanner tone='accent' icon={<ArrowLeftRight className='size-4 shrink-0' />}>
        {breakeven === null || breakeven <= 0
          ? '집값이 오르지 않아도 매수가 전세보다 싸다. 전세 보증금이 커서 묶이는 돈의 기회비용이 대출 이자와 세금을 넘어선 상황이다.'
          : `매수가 전세보다 싸지려면 집값이 해마다 ${breakeven.toFixed(1)}% 이상 올라야 한다. 지금 입력한 ${growth.toFixed(1)}%는 그 기준보다 ${growth >= breakeven ? '높다' : '낮다'}.`}
      </StatusBanner>

      <ExplainCard
        icon={<KeyRound className='size-4 text-emerald-500' />}
        title='전세의 비용은 눈에 보이지 않는다'
        preview='매달 나가는 돈이 없다는 것과 비용이 없다는 것은 다르다.'
        body={
          <>
            <p>
              전세는 2년 뒤 보증금을 그대로 돌려받으므로 비용이 0처럼 느껴진다. 하지만 그 돈은 그동안 아무것도 벌지
              못했다. 5억을 묶어 두고 예금 금리가 3%라면 해마다 1,500만원, 월 125만원을 포기한 셈이다. 이 숨은 비용과
              월세를 견주는 비율이 전월세전환율이고, 전환율이 예금 금리보다 높으면 전세가, 낮으면 월세가 유리해진다.
            </p>
            <p className='mt-2'>
              금리가 전세와 월세의 유불리를 뒤집는 것도 이 때문이다. 금리가 오르면 묶인 보증금의 기회비용이 커져 전세가
              불리해지고, 전세대출을 썼다면 이자까지 직접 나간다. 전세 페이지에서 본 보증금의 성격, 곧 임차인이
              임대인에게 무이자로 빌려준 돈이라는 사실이 여기서 비용으로 드러난다.
            </p>
          </>
        }
      />

      <ExplainCard
        icon={<TrendingUp className='size-4 text-sky-500' />}
        title='이 계산이 담지 못하는 것'
        preview='숫자로 옮기기 어려운 항목이 결정에서 차지하는 비중은 작지 않다.'
        body={
          <>
            <p>
              위 비교는 돈이 나가고 들어오는 것만 셌다. 실제 선택에는 숫자로 옮기기 어려운 항목이 많다. 매수는 이사를
              강요당하지 않는 안정성과 마음대로 고칠 자유를 주지만, 직장이 바뀌어도 쉽게 움직이지 못하게 만들고 자산
              대부분을 집 한 채에 몰아넣게 한다. 임차는 그 반대다.
            </p>
            <p className='mt-2'>
              계산 자체도 여러 단순화를 담고 있다. 취득세율은 주택 수와 가격대에 따라 크게 달라지고 보유세도 공시가격
              기준이라 실제와 다르다. 매도할 때 드는 중개보수와 양도세, 전세대출 이자, 갚은 원금에 대한 기회비용, 임대료
              상승은 넣지 않았다. 무엇보다 집값 상승률은 결과를 지배하는 변수인데 미리 알 수 없다. 이 도구는 답을 주는
              계산기가 아니라, 어떤 변수가 결과를 흔드는지 감을 잡는 그림에 가깝다.
            </p>
          </>
        }
      />
    </div>
  );
}
