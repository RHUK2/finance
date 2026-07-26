'use client';

import { useState } from 'react';

import { Banknote, CalendarClock, House, Percent, Ruler, Scale, Wallet } from 'lucide-react';

import {
  ControlSlider,
  CostBar,
  ExplainCard,
  Field,
  Metric,
  SectionIntro,
  SegmentedControl,
  StatusBanner,
} from '@/components/simulation';
import { Card } from '@/components/ui/card';
import { levelPayment, maxLoanByDsr } from '@/lib/mortgage';

// 금액 단위는 만원.
const DSR_CAP = 40;
const STRESS_ADD = 1.5;

const fmtEok = (n: number) => `${(n / 10000).toFixed(1)}억`;
const fmtMan = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}만원`;

export function Limit() {
  const [price, setPrice] = useState(80000);
  const [income, setIncome] = useState(7000);
  const [ltv, setLtv] = useState(70);
  const [rate, setRate] = useState(4);
  const [years, setYears] = useState(30);
  const [stress, setStress] = useState(true);

  const stressRate = rate + (stress ? STRESS_ADD : 0);
  const byLtv = (price * ltv) / 100;
  const byDsr = maxLoanByDsr(income, DSR_CAP, stressRate, years);
  const limit = Math.min(byLtv, byDsr);
  const cash = price - limit;
  const binding = byDsr < byLtv ? 'dsr' : 'ltv';

  // 한도는 스트레스 금리로 잡지만 실제로 내는 이자는 약정 금리다.
  const monthly = levelPayment(limit, rate, years);
  const dsrActual = ((monthly * 12) / income) * 100;
  const barMax = Math.max(byLtv, byDsr, price, 1);

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='얼마나 빌릴 수 있는가'>
        집을 담보로 잡는다고 해서 집값만큼 빌려주지는 않는다. 두 개의 자를 대고 그중 짧은 쪽에 맞춘다. 하나는 집을 보는
        자로, 담보 가치의 몇 퍼센트까지 빌려줄지 정한다. 다른 하나는 사람을 보는 자로, 갚을 소득이 되는지 따진다. 둘 중
        어느 쪽이 먼저 걸리는지가 대출의 성격을 정한다.
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
        />
        <ControlSlider
          icon={<Wallet className='size-4 text-emerald-500' />}
          label='연소득'
          value={income}
          onChange={setIncome}
          min={3000}
          max={20000}
          step={500}
          format={fmtMan}
          hint='DSR은 담보가 아니라 이 숫자를 본다. 소득이 늘지 않으면 집값이 올라도 빌릴 수 있는 돈은 늘지 않는다.'
        />
        <ControlSlider
          icon={<Ruler className='size-4 text-amber-500' />}
          label='LTV 한도'
          value={ltv}
          onChange={setLtv}
          min={30}
          max={80}
          step={5}
          format={(v) => `${v}%`}
          hint='담보 가치 대비 대출 비율의 상한. 규제지역 여부, 주택 수, 생애최초 여부에 따라 달라진다.'
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
          icon={<CalendarClock className='size-4 text-violet-500' />}
          label='만기'
          value={years}
          onChange={setYears}
          min={10}
          max={40}
          step={5}
          format={(v) => `${v}년`}
          hint='만기를 늘리면 연간 상환액이 줄어 DSR 한도가 늘어난다. 빌릴 수 있는 돈이 커지는 대신 총이자도 커진다.'
        />
        <Field label='스트레스 금리'>
          <SegmentedControl
            options={[
              { value: true, label: '적용' },
              { value: false, label: '미적용' },
            ]}
            value={stress}
            onChange={setStress}
          />
          <p className='text-muted-foreground text-xs'>
            한도를 계산할 때만 약정 금리에 {STRESS_ADD}%p를 얹어 본다. 나중에 금리가 올라도 갚을 수 있는지 미리 확인하는
            장치라, 실제로 내는 이자는 약정 금리 그대로다.
          </p>
        </Field>
      </Card>

      <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
        <Metric
          label='LTV가 허용하는 한도'
          value={fmtEok(byLtv)}
          tone={binding === 'ltv' ? 'accent' : undefined}
          sub={`집값의 ${ltv}%`}
        />
        <Metric
          label='DSR이 허용하는 한도'
          value={fmtEok(byDsr)}
          tone={binding === 'dsr' ? 'accent' : undefined}
          sub={stress ? `스트레스 금리 ${stressRate.toFixed(1)}% 기준` : `금리 ${rate.toFixed(1)}% 기준`}
        />
        <Metric label='실제 대출 한도' value={fmtEok(limit)} tone='good' sub='둘 중 짧은 자에 맞춘다' />
        <Metric
          label='필요한 자기 현금'
          value={fmtEok(cash)}
          tone={cash > price * 0.5 ? 'bad' : undefined}
          sub='취득세와 중개보수는 별도'
        />
      </div>

      <Card className='gap-4 p-4'>
        <CostBar
          label='LTV 한도'
          value={byLtv}
          max={barMax}
          className='bg-amber-500'
          format={fmtEok}
          sub='집을 보는 자, 담보 가치에 비례한다'
        />
        <CostBar
          label='DSR 한도'
          value={byDsr}
          max={barMax}
          className='bg-sky-500'
          format={fmtEok}
          sub='사람을 보는 자, 소득에 비례한다'
        />
        <CostBar
          label='자기 현금으로 메울 금액'
          value={cash}
          max={barMax}
          className='bg-rose-500'
          format={fmtEok}
          sub={`집값 ${fmtEok(price)} 중 대출로 안 되는 부분`}
        />
      </Card>

      <StatusBanner tone={binding === 'dsr' ? 'accent' : 'good'} icon={<Scale className='size-4 shrink-0' />}>
        {binding === 'dsr'
          ? `소득이 먼저 걸린다. 담보로는 ${fmtEok(byLtv)}까지 가능하지만 갚을 능력 기준으로 ${fmtEok(byDsr)}에서 잘린다. 집값이 더 올라도 이 사람이 빌릴 수 있는 돈은 늘지 않는다.`
          : `담보가 먼저 걸린다. 소득 기준으로는 ${fmtEok(byDsr)}까지 감당할 수 있지만 집값의 ${ltv}%인 ${fmtEok(byLtv)}이 상한이다. 이 경우 규제 비율이 곧 대출액을 정한다.`}
      </StatusBanner>

      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <Metric label='월 원리금 상환액' value={fmtMan(monthly)} sub={`원리금균등, 만기 ${years}년`} />
        <Metric
          label='소득 대비 연 원리금 비율'
          value={`${dsrActual.toFixed(1)}%`}
          tone={dsrActual > DSR_CAP ? 'bad' : 'good'}
          sub={`약정 금리 기준, 한도는 ${DSR_CAP}%`}
        />
      </div>

      <ExplainCard
        icon={<Banknote className='size-4 text-sky-500' />}
        title='두 자는 서로 다른 위험을 본다'
        preview='LTV는 은행이 떼일 위험을, DSR은 차주가 무너질 위험을 잰다.'
        body={
          <>
            <p>
              LTV는 담보를 팔았을 때 원금을 건질 수 있는지를 본다. 집값이 30% 빠져도 LTV 70%면 여전히 원금이 덮이므로
              은행의 손실을 막는 장치다. 반대로 차주가 매달 갚느라 생활이 무너지는지에는 관심이 없다. 그 자리를 메우는
              것이 DSR이다. 모든 대출의 연간 원리금을 합쳐 소득의 일정 비율 안에 묶어 두는 방식이라, 다른 대출이 이미
              있으면 주택담보대출 한도가 그만큼 줄어든다.
            </p>
            <p className='mt-2'>
              두 자의 성격 차이는 시장 전체에도 영향을 준다. LTV만 있으면 집값이 오를 때 담보 가치가 함께 올라 대출
              한도도 따라 늘고, 그 돈이 다시 집값을 밀어 올린다. DSR은 이 고리를 소득에 묶어 끊는다. 소득은 집값처럼
              빠르게 오르지 않으므로, DSR이 걸리는 순간부터는 집값이 올라도 빌릴 수 있는 돈이 늘지 않는다.
            </p>
            <p className='mt-2'>
              여기 계산은 주택담보대출 하나만 있다고 보고 기존 대출과 신용대출은 넣지 않았다. 규제 비율과 스트레스
              가산폭은 정책에 따라 자주 바뀌므로, 실제 한도는 은행에서 확인해야 한다.
            </p>
          </>
        }
      />
    </div>
  );
}
