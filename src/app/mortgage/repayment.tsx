'use client';

import { useMemo, useState } from 'react';

import { Banknote, CalendarClock, Coins, Percent, Scale } from 'lucide-react';

import {
  ControlSlider,
  ExplainCard,
  Field,
  Legend,
  Metric,
  SectionIntro,
  SegmentedControl,
  StatusBanner,
} from '@/components/simulation';
import { Card } from '@/components/ui/card';
import { byYear, REPAY_LABEL, REPAY_METHODS, schedule, type RepayMethod } from '@/lib/mortgage';
import { cn } from '@/lib/utils';

const fmtEok = (n: number) => `${(n / 10000).toFixed(2)}억`;
const fmtMan = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}만원`;

export function Repayment() {
  const [loan, setLoan] = useState(40000);
  const [rate, setRate] = useState(4);
  const [years, setYears] = useState(30);
  const [method, setMethod] = useState<RepayMethod>('equal-payment');

  // 세 방식을 한 번씩만 계산해 두고, 선택된 방식은 여기서 골라 쓴다.
  // 총이자를 나란히 두면 무엇을 사고파는 선택인지 드러난다.
  const totals = useMemo(
    () =>
      REPAY_METHODS.map((m) => {
        const rows = schedule(loan, rate, years, m);
        return { method: m, rows, interest: rows.reduce((s, r) => s + r.interest, 0) };
      }),
    [loan, rate, years],
  );

  const current = totals.find((t) => t.method === method) ?? totals[0];
  const rows = current.rows;
  const totalInterest = current.interest;
  const yearly = useMemo(() => byYear(rows), [rows]);

  const first = rows[0];
  const last = rows[rows.length - 1];
  const peak = Math.max(...yearly.map((y) => y.interest + y.principal));

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='같은 돈을 빌려도 갚는 모양이 다르다'>
        원금과 금리와 만기가 같아도 상환 방식에 따라 매달 나가는 돈과 평생 내는 이자가 달라진다. 이자는 남은 잔액에
        붙으므로, 원금을 빨리 줄일수록 총이자가 작아진다. 결국 지금의 부담과 나중의 이자를 맞바꾸는 선택이다.
      </SectionIntro>

      <Card className='gap-5 p-4'>
        <Field label='상환 방식'>
          <SegmentedControl
            options={REPAY_METHODS.map((m) => ({ value: m, label: REPAY_LABEL[m] }))}
            value={method}
            onChange={setMethod}
          />
        </Field>
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
          icon={<Percent className='size-4 text-rose-500' />}
          label='금리'
          value={rate}
          onChange={setRate}
          min={2.5}
          max={7}
          step={0.1}
          format={(v) => `${v.toFixed(1)}%`}
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
      </Card>

      <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
        <Metric
          label='첫 달 상환액'
          value={fmtMan(first.interest + first.principal)}
          sub={`이자 ${fmtMan(first.interest)}`}
        />
        <Metric
          label='마지막 달 상환액'
          value={fmtMan(last.interest + last.principal)}
          sub={method === 'bullet' ? '원금을 한 번에 갚는다' : `이자 ${fmtMan(last.interest)}`}
        />
        <Metric
          label='총 이자'
          value={fmtEok(totalInterest)}
          tone='bad'
          sub={`원금의 ${((totalInterest / loan) * 100).toFixed(0)}%`}
        />
        <Metric label='총 상환액' value={fmtEok(loan + totalInterest)} sub={`원금 ${fmtEok(loan)} 포함`} />
      </div>

      <Card className='gap-3 p-4'>
        <div className='flex flex-col gap-1'>
          <span className='flex items-center gap-1.5 text-sm font-semibold'>
            <Coins className='size-4 text-emerald-500' />
            해마다 내는 돈은 어떻게 구성되는가
          </span>
          <span className='text-muted-foreground text-xs'>막대 하나가 1년이고, 높이는 그해에 낸 돈의 합이다</span>
        </div>
        <div className='flex h-40 items-end gap-0.5'>
          {yearly.map((y, i) => {
            const total = y.interest + y.principal;
            return (
              <div key={i} className='flex h-full flex-1 flex-col justify-end'>
                <div
                  className='flex w-full flex-col justify-end'
                  style={{ height: `${Math.max(1, (total / peak) * 100)}%` }}
                >
                  <div className='w-full rounded-t-[2px] bg-rose-500' style={{ flexGrow: y.interest }} />
                  <div className='w-full bg-emerald-500' style={{ flexGrow: y.principal }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className='text-muted-foreground flex flex-wrap gap-x-4 gap-y-1.5 text-xs'>
          <Legend className='bg-rose-500' label='이자' />
          <Legend className='bg-emerald-500' label='원금' />
          <span className='tabular-nums'>1년차부터 {years}년차까지</span>
        </div>
      </Card>

      <StatusBanner tone='accent' icon={<Scale className='size-4 shrink-0' />}>
        {method === 'equal-payment'
          ? '매달 내는 총액이 같다. 다만 그 안에서 이자 비중이 앞쪽에 몰려 있어, 초반에는 갚아도 원금이 잘 줄지 않는다.'
          : method === 'equal-principal'
            ? '원금을 매달 같은 금액씩 갚는다. 잔액이 빠르게 줄어 이자도 함께 줄지만, 초반 부담이 가장 크다.'
            : '만기까지 이자만 낸다. 매달 부담은 가장 가볍지만 원금이 한 푼도 줄지 않아 총이자가 가장 크고, 만기에 원금 전액을 마련해야 한다.'}
      </StatusBanner>

      <Card className='gap-0 overflow-hidden p-0'>
        <div className='p-4 text-sm font-semibold'>세 방식의 총이자</div>
        <div className='text-muted-foreground grid grid-cols-[1fr_6rem_5rem] gap-x-2 border-y px-4 py-2 text-xs'>
          <span>상환 방식</span>
          <span className='text-right'>총이자</span>
          <span className='text-right'>원리금균등 대비</span>
        </div>
        {totals.map((t) => {
          const diff = t.interest - totals[0].interest;
          return (
            <div
              key={t.method}
              className={cn(
                'grid grid-cols-[1fr_6rem_5rem] gap-x-2 border-b px-4 py-2.5 text-sm last:border-b-0',
                t.method === method && 'bg-muted',
              )}
            >
              <span>{REPAY_LABEL[t.method]}</span>
              <span className='text-right tabular-nums'>{fmtEok(t.interest)}</span>
              <span
                className={cn(
                  'text-right tabular-nums',
                  diff > 0 && 'text-rose-600 dark:text-rose-400',
                  diff < 0 && 'text-emerald-600 dark:text-emerald-400',
                  diff === 0 && 'text-muted-foreground',
                )}
              >
                {diff === 0 ? '기준' : `${diff > 0 ? '+' : ''}${fmtEok(diff)}`}
              </span>
            </div>
          );
        })}
      </Card>

      <ExplainCard
        icon={<Coins className='size-4 text-amber-500' />}
        title='초반에 원금이 줄지 않는 이유'
        preview='이자는 남은 잔액에 붙는다. 잔액이 가장 큰 시점이 바로 대출 초기다.'
        body={
          <>
            <p>
              원리금균등에서 매달 내는 총액은 고정이지만 그 구성은 계속 바뀐다. 첫 달에는 잔액이 원금 전액이라 이자가
              가장 크고, 정해진 납입액에서 이자를 뺀 나머지만 원금으로 들어간다. 잔액이 조금 줄면 다음 달 이자가 조금
              줄고, 그만큼 원금 상환분이 늘어난다. 이 과정이 눈덩이처럼 가속되기 때문에 위 그래프에서 초록색 영역이 뒤로
              갈수록 두꺼워진다.
            </p>
            <p className='mt-2'>
              그래서 대출 초기의 중도상환은 효과가 크다. 갚은 금액만큼의 잔액이 남은 기간 내내 이자를 낳지 않기
              때문이다. 반대로 만기가 얼마 남지 않은 시점의 중도상환은 아낄 이자가 별로 없다. 중도상환수수료가 보통 대출
              실행 후 3년 안에만 붙는 것도 이 구간의 상환이 은행의 이자 수익을 가장 많이 깎기 때문이다.
            </p>
            <p className='mt-2'>
              만기 연장이 늘 유리한 것도 아니다. 만기를 늘리면 월 상환액이 줄고 DSR 한도가 늘어 더 큰 집을 살 수 있게
              되지만, 잔액이 오래 남는 만큼 총이자는 크게 불어난다. 위 표에서 만기를 바꿔 가며 총이자를 비교해 보면 그
              크기를 가늠할 수 있다.
            </p>
          </>
        }
      />
    </div>
  );
}
