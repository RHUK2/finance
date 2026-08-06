'use client';

import { useMemo, useState } from 'react';

import { Banknote, CalendarClock, Percent, ShieldCheck, TrendingUp, TriangleAlert, Wallet } from 'lucide-react';

import { ControlSlider, CostBar, ExplainCard, Metric, SectionIntro, StatusBanner } from '@/components/simulation';
import { Card } from '@/components/ui/card';
import { levelPayment, schedule } from '@/lib/mortgage';

// 변동금리가 몇 년 뒤에 움직인다고 보고 계산한다. 고정금리는 그 대가로 처음부터 가산금리를 얹는다.
const SHIFT_YEAR = 3;
const FIXED_PREMIUM = 0.5;
const DSR_CAP = 40;

const fmtEok = (n: number) => `${(n / 10000).toFixed(2)}억`;
const fmtMan = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}만원`;

export function RateStress() {
  const [loan, setLoan] = useState(40000);
  const [rate, setRate] = useState(3.5);
  const [delta, setDelta] = useState(2);
  const [years, setYears] = useState(30);
  const [income, setIncome] = useState(7000);

  // 금리가 오르기 전 구간은 상승폭과 무관하므로 따로 memo해 슬라이더를 움직여도 다시 계산하지 않는다.
  const head = useMemo(() => {
    const rows = schedule(loan, rate, years, 'equal-payment').slice(0, SHIFT_YEAR * 12);
    return {
      balance: rows[rows.length - 1].balance,
      interest: rows.reduce((s, r) => s + r.interest, 0),
    };
  }, [loan, rate, years]);

  const after = useMemo(() => {
    const tail = schedule(head.balance, rate + delta, years - SHIFT_YEAR, 'equal-payment');
    return {
      balance: head.balance,
      monthly: levelPayment(head.balance, rate + delta, years - SHIFT_YEAR),
      interest: head.interest + tail.reduce((s, r) => s + r.interest, 0),
    };
  }, [head, rate, delta, years]);

  const fixedInterest = useMemo(
    () => schedule(loan, rate + FIXED_PREMIUM, years, 'equal-payment').reduce((s, r) => s + r.interest, 0),
    [loan, rate, years],
  );

  const before = levelPayment(loan, rate, years);
  const fixed = levelPayment(loan, rate + FIXED_PREMIUM, years);
  const jump = after.monthly - before;
  const jumpPct = (jump / before) * 100;
  const dsrBefore = ((before * 12) / income) * 100;
  const dsrAfter = ((after.monthly * 12) / income) * 100;
  const barMax = Math.max(after.monthly, fixed, before, 1);

  const banner =
    dsrAfter > DSR_CAP
      ? {
          tone: 'bad' as const,
          icon: <TriangleAlert className='size-4 shrink-0' />,
          text: `상환액이 소득의 ${dsrAfter.toFixed(0)}%까지 올라간다. 대출을 새로 받는다면 승인되지 않았을 수준이라, 스트레스 금리로 한도를 미리 깎아 두는 이유가 여기 있다.`,
        }
      : jumpPct > 20
        ? {
            tone: 'accent' as const,
            icon: <TrendingUp className='size-4 shrink-0' />,
            text: `금리는 ${delta.toFixed(2)}%p 올랐는데 월 상환액은 ${jumpPct.toFixed(0)}% 늘었다. 이자만이 아니라 남은 원금을 더 짧아진 기간에 갚아야 하기 때문이다.`,
          }
        : {
            tone: 'good' as const,
            icon: <ShieldCheck className='size-4 shrink-0' />,
            text: '상승폭을 감당할 수 있는 범위다. 그래도 변동금리는 이 숫자가 계약으로 보장되지 않는다는 점이 고정금리와 다르다.',
          };

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='금리가 오르면 무슨 일이 생기는가'>
        변동금리는 지금 싼 대신 나중을 약속하지 않는다. 금리가 오르면 남은 원금에 새 금리가 붙고, 남은 기간 안에 다
        갚아야 하므로 월 상환액이 그만큼 뛴다. 이미 갚은 기간이 짧을수록 잔액이 크게 남아 있어 충격도 크다. 몇 년 뒤
        금리가 움직인다고 보고 그 폭을 조절해 보자.
      </SectionIntro>

      <Card className='gap-5 p-4'>
        <ControlSlider
          icon={<Banknote className='size-4 text-sky-500' />}
          label='대출 원금'
          value={loan}
          onChange={setLoan}
          min={5000}
          max={100000}
          step={1000}
          format={fmtEok}
        />
        <ControlSlider
          icon={<Percent className='size-4 text-emerald-500' />}
          label='처음 금리'
          value={rate}
          onChange={setRate}
          min={2}
          max={6}
          step={0.1}
          format={(v) => `${v.toFixed(1)}%`}
        />
        <ControlSlider
          icon={<TrendingUp className='size-4 text-rose-500' />}
          label='금리 상승폭'
          value={delta}
          onChange={setDelta}
          min={0}
          max={4}
          step={0.25}
          format={(v) => `+${v.toFixed(2)}%p`}
          hint={`${SHIFT_YEAR}년 뒤 금리가 이만큼 올라 만기까지 유지된다고 본다. 오른 금리는 남은 잔액에만 붙는다.`}
        />
        <ControlSlider
          icon={<CalendarClock className='size-4 text-violet-500' />}
          label='만기'
          value={years}
          onChange={setYears}
          min={10}
          max={40}
          step={5}
          format={(v) => `${v}년`}
        />
        <ControlSlider
          icon={<Wallet className='size-4 text-amber-500' />}
          label='연소득'
          value={income}
          onChange={setIncome}
          min={3000}
          max={20000}
          step={500}
          format={fmtMan}
        />
      </Card>

      <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
        <Metric label='지금 월 상환액' value={fmtMan(before)} sub={`금리 ${rate.toFixed(1)}%`} />
        <Metric
          label={`${SHIFT_YEAR}년 뒤 월 상환액`}
          value={fmtMan(after.monthly)}
          tone={jumpPct > 20 ? 'bad' : jumpPct > 0 ? 'accent' : 'good'}
          sub={`금리 ${(rate + delta).toFixed(1)}%, 잔액 ${fmtEok(after.balance)}`}
        />
        <Metric
          label='월 부담 증가'
          value={fmtMan(jump)}
          tone={jump > 0 ? 'bad' : 'good'}
          sub={`${jumpPct >= 0 ? '+' : ''}${jumpPct.toFixed(1)}%`}
        />
        <Metric
          label='소득 대비 원리금'
          value={`${dsrAfter.toFixed(1)}%`}
          tone={dsrAfter > DSR_CAP ? 'bad' : 'good'}
          sub={`상승 전 ${dsrBefore.toFixed(1)}%`}
        />
      </div>

      <Card className='gap-4 p-4'>
        <CostBar
          label='변동금리, 상승 전'
          value={before}
          max={barMax}
          className='bg-emerald-500'
          format={fmtMan}
          sub={`처음 ${SHIFT_YEAR}년 동안의 월 상환액`}
        />
        <CostBar
          label='변동금리, 상승 후'
          value={after.monthly}
          max={barMax}
          className='bg-rose-500'
          format={fmtMan}
          sub='남은 기간에 잔액을 다 갚아야 하므로 인상폭보다 크게 뛴다'
        />
        <CostBar
          label={`고정금리 (+${FIXED_PREMIUM}%p)`}
          value={fixed}
          max={barMax}
          className='bg-sky-500'
          format={fmtMan}
          sub='처음부터 끝까지 이 금액으로 고정된다'
        />
      </Card>

      <StatusBanner tone={banner.tone} icon={banner.icon}>
        {banner.text}
      </StatusBanner>

      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <Metric
          label='변동금리 총이자'
          value={fmtEok(after.interest)}
          tone={after.interest > fixedInterest ? 'bad' : 'good'}
          sub={`${SHIFT_YEAR}년 뒤 ${(rate + delta).toFixed(1)}%로 오른 경우`}
        />
        <Metric
          label='고정금리 총이자'
          value={fmtEok(fixedInterest)}
          tone={fixedInterest > after.interest ? 'bad' : 'good'}
          sub={`처음부터 ${(rate + FIXED_PREMIUM).toFixed(1)}%`}
        />
      </div>

      <ExplainCard
        icon={<TrendingUp className='size-4 text-rose-500' />}
        title='금리 인상폭보다 상환액 인상폭이 큰 이유'
        preview='남은 원금은 그대로인데 갚을 기간만 짧아져 있기 때문이다.'
        body={
          <>
            <p>
              금리가 2%p 올랐다고 상환액이 2% 오르는 것이 아니다. 월 상환액은 남은 잔액을 남은 기간에 나눠 갚도록 다시
              계산된다. 처음 몇 년은 원금이 거의 줄지 않으므로 잔액은 여전히 원금에 가까운데 기간만 줄어 있다. 늘어난
              이자와 짧아진 기간이 겹치면서 상환액은 금리 인상폭보다 훨씬 크게 뛴다.
            </p>
            <p className='mt-2'>
              고정금리는 이 위험을 은행이 대신 지는 대가로 처음부터 조금 높은 금리를 받는다. 위 두 총이자를 비교하면
              선택의 성격이 드러난다. 금리가 오르지 않으면 고정금리가 더 비싸고, 크게 오르면 고정금리가 싸진다. 어느
              쪽이 이길지 미리 알 수 없으므로, 실제 판단 기준은 어느 쪽이 싼가보다 최악의 경우에 감당할 수 있는가에
              가깝다.
            </p>
            <p className='mt-2'>
              여기 계산은 금리가 한 번 올라 만기까지 유지된다고 단순화했다. 실제 변동금리는 주기마다 지표금리를 따라
              오르내리고, 상승폭에 상한을 두는 상품이나 일정 기간 고정 후 변동으로 바뀌는 혼합형도 있다.
            </p>
          </>
        }
      />
    </div>
  );
}
