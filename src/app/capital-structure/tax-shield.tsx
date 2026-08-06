'use client';

import { useState } from 'react';

import { Building2, Landmark, Receipt, Scale, ShieldCheck, Users } from 'lucide-react';

import { ControlSlider, ExplainCard, Legend, Metric, SectionIntro, StatusBanner } from '@/components/simulation';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// 단위는 억원. 세금 방패만 떼어 보기 위해 영업이익과 이자율은 고정한다.
const ASSETS = 1000;
const EBIT = 150;
const RATE = 5;

// 부채가 늘수록 커지는 재무곤경 기대비용. 방패는 부채에 비례해 늘기만 하므로,
// 이보다 가파른 4차식으로 두어야 내부 최적점이 생긴다.
const DISTRESS_K = 0.3;
const STEPS = Array.from({ length: 19 }, (_, i) => i * 5);

const fmt = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}억`;

function firmValue(debtPct: number, taxRate: number) {
  const shield = ((ASSETS * debtPct) / 100) * (taxRate / 100);
  const distress = ASSETS * DISTRESS_K * (debtPct / 100) ** 4;
  return ASSETS + shield - distress;
}

export function TaxShield() {
  const [debtRatio, setDebtRatio] = useState(40);
  const [taxRate, setTaxRate] = useState(20);

  const debt = (ASSETS * debtRatio) / 100;
  const interest = (debt * RATE) / 100;
  const tax = Math.max(0, EBIT - interest) * (taxRate / 100);
  const net = EBIT - interest - tax;
  const shield = EBIT * (taxRate / 100) - tax;

  const curve = STEPS.map((d) => ({ d, v: firmValue(d, taxRate) }));
  const best = curve.reduce((a, b) => (b.v > a.v ? b : a));
  const current = firmValue(debtRatio, taxRate);

  // 영업이익 150억이 세 곳으로 갈라진다. 부채 비중을 올리면 정부 몫이 줄어든다.
  const slices = [
    { label: '채권자 (이자)', value: interest, className: 'bg-rose-500' },
    { label: '정부 (법인세)', value: tax, className: 'bg-slate-400' },
    { label: '주주 (순이익)', value: net, className: 'bg-emerald-500' },
  ].filter((s) => s.value > 0);

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='이자는 비용이고 배당은 아니다'>
        회사가 번 돈은 채권자, 정부, 주주 세 곳으로 갈라진다. 그런데 이자는 손금으로 인정돼 과세 대상을 줄이는 반면
        배당은 세금을 낸 뒤의 돈에서 나간다. 같은 자금을 빌려서 조달하느냐 주식으로 조달하느냐에 따라 정부 몫이
        달라진다는 뜻이다. 세법이 부채에 얹어 준 이 보조금을 세금 방패라고 부른다.
      </SectionIntro>

      <Card className='gap-5 p-4'>
        <ControlSlider
          icon={<Scale className='size-4 text-rose-500' />}
          label='부채 비중'
          value={debtRatio}
          onChange={setDebtRatio}
          min={0}
          max={90}
          step={5}
          format={(v) => `${v}%`}
          hint={`영업이익 ${fmt(EBIT)}, 이자율 ${RATE}%로 고정해 두고 조달 방식만 바꾼다. 부채 ${fmt(debt)}에 이자 ${fmt(interest)}.`}
        />
        <ControlSlider
          icon={<Receipt className='size-4 text-slate-500' />}
          label='법인세율'
          value={taxRate}
          onChange={setTaxRate}
          min={0}
          max={30}
          step={1}
          format={(v) => `${v}%`}
          hint='세율이 0이면 방패도 사라진다. 부채의 세금 혜택은 세법이 만들어 낸 것이지 부채 자체의 성질이 아니다.'
        />
      </Card>

      <Card className='gap-3 p-4'>
        <span className='flex items-center gap-1.5 text-sm font-semibold'>
          <Users className='size-4 text-sky-500' />
          영업이익 {fmt(EBIT)}은 누구에게 갔는가
        </span>
        <div className='bg-muted flex h-8 w-full overflow-hidden rounded-md'>
          {slices.map((s) => (
            <div
              key={s.label}
              className={cn('h-full transition-all', s.className)}
              style={{ width: `${(s.value / EBIT) * 100}%` }}
            />
          ))}
        </div>
        <div className='text-muted-foreground flex flex-wrap gap-x-4 gap-y-1.5 text-xs'>
          {slices.map((s) => (
            <Legend key={s.label} className={s.className} label={`${s.label} ${fmt(s.value)}`} />
          ))}
        </div>
      </Card>

      <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
        <Metric label='채권자가 받는 이자' value={fmt(interest)} sub='실적과 무관하게 확정' />
        <Metric label='정부가 걷는 법인세' value={fmt(tax)} sub={`무차입이면 ${fmt(EBIT * (taxRate / 100))}`} />
        <Metric label='주주 몫 순이익' value={fmt(net)} tone={net > 0 ? undefined : 'bad'} />
        <Metric
          label='세금 방패'
          value={fmt(shield)}
          tone={shield > 0 ? 'good' : undefined}
          sub='줄어든 법인세만큼 파이가 커진다'
        />
      </div>

      <StatusBanner tone={shield > 0 ? 'good' : 'accent'} icon={<ShieldCheck className='size-4 shrink-0' />}>
        {shield > 0
          ? `이자를 비용으로 털어 낸 덕분에 정부로 나갈 ${fmt(shield)}이 회사 안에 남았다. 채권자와 주주가 나눠 갖는 몫의 합이 그만큼 커진다.`
          : '세율이 0이라 이자를 아무리 늘려도 아낄 세금이 없다. 이때 자본구조는 파이를 자르는 방식일 뿐 파이의 크기를 바꾸지 못한다.'}
      </StatusBanner>

      <Card className='gap-3 p-4'>
        <div className='flex flex-col gap-1'>
          <span className='flex items-center gap-1.5 text-sm font-semibold'>
            <Building2 className='size-4 text-amber-500' />
            그렇다면 빚을 최대한 내야 하는가
          </span>
          <span className='text-muted-foreground text-xs'>
            세금 방패에서 재무곤경 기대비용을 뺀 기업가치. 막대 하나가 부채 비중 5%p다
          </span>
        </div>
        <ValueCurve curve={curve} current={debtRatio} best={best.d} />
        <div className='text-muted-foreground flex flex-wrap gap-x-4 gap-y-1.5 text-xs'>
          <Legend className='bg-sky-500' label='현재 선택' />
          <Legend className='bg-emerald-500' label='가치가 가장 큰 지점' />
          <Legend className='bg-muted-foreground/30' label='그 밖' />
        </div>
      </Card>

      <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
        <Metric label='지금 자본구조의 기업가치' value={fmt(current)} />
        <Metric label='가치가 가장 커지는 부채 비중' value={`${best.d}%`} tone='accent' sub={fmt(best.v)} />
        <Metric
          label='무차입 대비 증감'
          value={fmt(current - ASSETS)}
          tone={current > ASSETS ? 'good' : 'bad'}
          sub={`무차입 기업가치 ${fmt(ASSETS)}`}
        />
      </div>

      <ExplainCard
        icon={<Landmark className='size-4 text-rose-500' />}
        title='방패에는 대가가 따른다'
        preview='빚이 늘수록 세금은 줄지만, 망할 확률과 망했을 때 새는 돈이 함께 커진다.'
        body={
          <>
            <p>
              세금 방패만 보면 부채는 많을수록 좋다. 위 곡선이 오른쪽 끝에서 무너지는 건 반대편에 재무곤경 비용이 있기
              때문이다. 파산 절차에 들어가면 변호사와 회계사에게 돈이 나가고 자산은 헐값에 팔린다. 그보다 먼저,
              위태롭다는 사실 자체가 비용을 만든다. 거래처가 선결제를 요구하고, 우수한 직원이 떠나고, 회수에 몇 년
              걸리는 투자를 포기하게 된다. 실제로 파산하지 않아도 이미 값을 치르는 셈이다.
            </p>
            <p className='mt-2'>
              그래서 최적 부채 비중은 업종마다 다르다. 현금흐름이 안정적이고 팔기 쉬운 유형자산이 많은 회사는 곤경
              비용이 낮아 빚을 많이 진다. 통신사나 부동산 임대업이 그렇다. 반대로 자산 대부분이 사람과 기술인 회사는
              위태로워지는 순간 그 자산이 걸어 나가므로 부채를 거의 쓰지 않는다. 같은 세율 아래에서도 자본구조가 갈리는
              이유다.
            </p>
            <p className='mt-2'>
              세법도 방패를 무한정 열어 두지는 않는다. 지나친 차입에 붙는 이자를 손금에서 빼는 규정들이 있어 실제
              공제액은 여기 계산보다 작을 수 있다. 이 곡선은 방향을 보여주는 그림이지 최적점을 찾아 주는 계산기가
              아니다.
            </p>
          </>
        }
      />
    </div>
  );
}

function ValueCurve({ curve, current, best }: { curve: { d: number; v: number }[]; current: number; best: number }) {
  const values = curve.map((p) => p.v);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;

  // 막대 높이와 눈금을 각각 한 줄로 나눠, 라벨 유무가 막대 길이에 영향을 주지 않게 한다.
  return (
    <div className='flex flex-col gap-1'>
      <div className='flex h-32 items-end gap-0.5'>
        {curve.map((p) => (
          <div
            key={p.d}
            className={cn(
              'flex-1 rounded-t-[2px] transition-all',
              p.d === current ? 'bg-sky-500' : p.d === best ? 'bg-emerald-500' : 'bg-muted-foreground/30',
            )}
            style={{ height: `${8 + ((p.v - lo) / span) * 92}%` }}
          />
        ))}
      </div>
      <div className='text-muted-foreground flex gap-0.5 text-[10px] tabular-nums'>
        {curve.map((p) => (
          <span key={p.d} className='flex-1 text-center'>
            {p.d % 20 === 0 ? `${p.d}%` : ''}
          </span>
        ))}
      </div>
    </div>
  );
}
