'use client';

import { useState } from 'react';

import { Banknote, Gavel, HardHat, Landmark, PieChart, Receipt, Users } from 'lucide-react';

import { ControlSlider, ExplainCard, Metric, SectionIntro, StatusBanner } from '@/components/simulation';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// 단위는 억원. 장부상 자산 1,000억짜리 회사가 청산에 들어갔다고 하자.
const BOOK_ASSETS = 1000;

type Tier = {
  id: string;
  label: string;
  kind: 'debt' | 'equity';
  claim: number;
  icon: React.ComponentType<{ className?: string }>;
  className: string;
  note: string;
};

const TIERS: Tier[] = [
  {
    id: 'wage',
    kind: 'debt',
    label: '최우선변제 임금채권',
    claim: 40,
    icon: HardHat,
    className: 'bg-emerald-500',
    note: '최종 3개월분 임금과 최종 3년분 퇴직급여, 재해보상금은 담보권보다도 앞선다. 사람의 생계가 걸린 채권이라 법이 순위를 따로 끌어올려 뒀다.',
  },
  {
    id: 'secured',
    kind: 'debt',
    label: '담보부채권',
    claim: 300,
    icon: Landmark,
    className: 'bg-sky-500',
    note: '공장과 토지에 근저당을 잡은 은행이다. 특정 자산을 붙들고 있어 다른 채권자와 나누지 않고 그 자산에서 먼저 회수한다.',
  },
  {
    id: 'unsecured',
    kind: 'debt',
    label: '일반채권',
    claim: 260,
    icon: Receipt,
    className: 'bg-amber-500',
    note: '거래처 외상값, 담보 없는 회사채, 미지급 세금 같은 것들이다. 담보가 없으니 남은 재산을 채권액 비율대로 나눠 갖는다.',
  },
  {
    id: 'sub',
    kind: 'debt',
    label: '후순위채',
    claim: 100,
    icon: Banknote,
    className: 'bg-fuchsia-500',
    note: '일반채권보다 뒤에 서겠다고 계약서에 스스로 적은 채권이다. 순위를 내주는 대가로 더 높은 금리를 받는다.',
  },
  {
    id: 'pref',
    kind: 'equity',
    label: '우선주',
    claim: 100,
    icon: PieChart,
    className: 'bg-violet-500',
    note: '이름에 우선이 붙지만 채권 전체보다는 뒤다. 보통주보다 먼저 배당받고 청산 시 먼저 분배받을 뿐이다.',
  },
  {
    id: 'common',
    kind: 'equity',
    label: '보통주',
    claim: 300,
    icon: Users,
    className: 'bg-rose-500',
    note: '앞의 모두가 만족한 뒤 남은 전부를 가져간다. 남지 않으면 한 푼도 못 받는다. 그 대신 회사가 잘될 때 늘어나는 가치에는 상한이 없다.',
  },
];

const TOTAL_CLAIM = TIERS.reduce((s, t) => s + t.claim, 0);
const DEBT_CLAIM = TIERS.filter((t) => t.kind === 'debt').reduce((s, t) => s + t.claim, 0);

const fmt = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}억`;

export function Waterfall() {
  const [proceeds, setProceeds] = useState(550);

  // 위에서부터 순서대로 물을 채운다. 앞 계층이 다 차야 다음 계층에 물이 닿는다.
  const rows: (Tier & { paid: number; rate: number })[] = [];
  let remaining = proceeds;
  for (const t of TIERS) {
    const paid = Math.min(t.claim, remaining);
    remaining -= paid;
    rows.push({ ...t, paid, rate: (paid / t.claim) * 100 });
  }

  const fulcrum = rows.find((r) => r.paid > 0 && r.paid < r.claim) ?? rows.find((r) => r.paid === 0);
  const debtPaid = rows.filter((r) => r.kind === 'debt').reduce((s, r) => s + r.paid, 0);
  const common = rows[rows.length - 1];
  const focus = fulcrum ?? common;
  const discount = ((BOOK_ASSETS - proceeds) / BOOK_ASSETS) * 100;

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='물은 위에서부터 채워진다'>
        회사가 문을 닫고 자산을 모두 팔았다. 그 돈은 정해진 순서대로 흘러간다. 앞 계층의 청구권이 100% 채워지기 전까지는
        다음 계층에 한 푼도 가지 않는다. 이 순서를 아는 것이 자본구조를 이해하는 일의 절반이다. 매각 대금을 움직여 어느
        층에서 물이 끊기는지 보자.
      </SectionIntro>

      <Card className='p-4'>
        <ControlSlider
          icon={<Gavel className='size-4 text-sky-500' />}
          label='자산 매각 대금'
          value={proceeds}
          onChange={setProceeds}
          min={0}
          max={1100}
          step={25}
          format={fmt}
          hint={`장부상 자산은 ${fmt(BOOK_ASSETS)}이지만 급히 처분하면 그만큼 못 받는 경우가 많다. 지금은 장부가 대비 ${discount > 0 ? `${discount.toFixed(0)}% 할인` : `${(-discount).toFixed(0)}% 웃돈`}이다.`}
        />
      </Card>

      <Card className='gap-4 p-4'>
        <span className='text-muted-foreground text-xs'>
          매각 대금 {fmt(proceeds)}이 위에서 아래로 흐른다. 총 청구액은 {fmt(TOTAL_CLAIM)}
        </span>
        {rows.map((r) => (
          <div key={r.id} className='flex flex-col gap-1'>
            <div className='flex items-baseline justify-between gap-2 text-sm'>
              <span className='flex items-center gap-1.5 font-medium'>
                <r.icon className='text-muted-foreground size-4 shrink-0' />
                {r.label}
              </span>
              <span className='shrink-0 tabular-nums'>
                {fmt(r.paid)}
                <span className='text-muted-foreground'> / {fmt(r.claim)}</span>
              </span>
            </div>
            <div className='bg-muted h-5 w-full overflow-hidden rounded-md'>
              <div
                className={cn('h-full rounded-md transition-all', r.className)}
                style={{ width: `${Math.max(r.paid > 0 ? 1 : 0, r.rate)}%` }}
              />
            </div>
            <span className='text-muted-foreground text-xs'>
              회수율 {r.rate.toFixed(0)}%
              {r.rate === 100 ? ', 전액 회수' : r.rate === 0 ? ', 물이 닿지 않았다' : ', 여기서 물이 끊긴다'}
            </span>
          </div>
        ))}
      </Card>

      <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
        <Metric
          label='채권 전체 회수율'
          value={`${((debtPaid / DEBT_CLAIM) * 100).toFixed(0)}%`}
          tone={debtPaid >= DEBT_CLAIM ? 'good' : 'bad'}
          sub={`청구 ${fmt(DEBT_CLAIM)} 중 ${fmt(debtPaid)}`}
        />
        <Metric
          label='보통주주에게 남는 돈'
          value={fmt(common.paid)}
          tone={common.paid > 0 ? 'good' : 'bad'}
          sub={common.paid > 0 ? `출자 ${fmt(common.claim)} 대비` : '앞에서 모두 소진됐다'}
        />
        <Metric
          label='손실을 나눠 지는 계층'
          value={fulcrum ? fulcrum.label : '없음'}
          tone='accent'
          sub='물이 끊기는 지점'
        />
      </div>

      <StatusBanner
        tone={common.paid > 0 ? 'good' : debtPaid >= DEBT_CLAIM ? 'accent' : 'bad'}
        icon={<Gavel className='size-4 shrink-0' />}
      >
        {common.paid > 0
          ? `모든 채권과 우선주를 만족시키고도 ${fmt(common.paid)}이 남아 보통주주에게 돌아간다. 주주가 무언가를 받는 청산은 드물다.`
          : debtPaid >= DEBT_CLAIM
            ? '빚은 모두 갚았지만 주식에 배분할 돈이 부족하다. 채권자는 온전히 회수하고 주주만 손실을 진다.'
            : `채권 단계에서 이미 물이 끊겼다. 이 상태에서 주식은 값이 0이고, 회사의 사실상 주인은 손실을 나눠 지게 된 채권자다.`}
      </StatusBanner>

      <Card className='gap-2 p-4'>
        <span className='flex items-center gap-1.5 font-semibold'>
          <PieChart className='size-4 text-violet-500' />
          {focus.label}
        </span>
        <p className='text-muted-foreground text-sm/relaxed'>{focus.note}</p>
      </Card>

      <ExplainCard
        icon={<Banknote className='size-4 text-fuchsia-500' />}
        title='순위는 대부분 계약으로 만들어진다'
        preview='법이 정한 순위는 일부이고, 나머지는 당사자들이 스스로 줄을 선 결과다.'
        body={
          <>
            <p>
              임금채권처럼 법이 직접 끌어올린 순위도 있지만, 자본구조의 층 대부분은 계약의 산물이다. 담보는 특정 자산을
              붙들어 다른 채권자를 제치는 약정이고, 후순위채는 반대로 뒤에 서겠다는 약속을 문서로 남긴 것이다. 뒤에
              설수록 떼일 확률이 높으니 그만큼 높은 금리를 요구한다. 층마다 붙는 이자율의 차이는 곧 그 층이 감수하는
              위험의 값이다.
            </p>
            <p className='mt-2'>
              그래서 같은 회사에 돈을 넣더라도 어느 층에 들어가느냐가 수익과 위험을 함께 정한다. 위층은 먼저 받는 대신
              회사가 잘돼도 약속된 이자까지만 받고, 아래층은 마지막에 받는 대신 남는 것을 전부 가져간다. 앞 탭에서 본
              레버리지의 증폭도 결국 이 줄 세우기의 결과다.
            </p>
          </>
        }
      />

      <ExplainCard
        icon={<Users className='size-4 text-sky-500' />}
        title='주식이 0이 되면 회사의 주인이 바뀐다'
        preview='손실을 실제로 지게 된 계층이 회생 절차에서 의사결정권을 넘겨받는다.'
        body={
          <>
            <p>
              물이 채권 단계에서 끊기면 주주 지분의 값은 0이다. 이때 회사를 청산하지 않고 살리기로 하면, 손실을 나눠
              지게 된 계층이 새 주인이 되는 일이 흔하다. 기존 주식을 감자로 소각하고 그 자리에 채권을 주식으로 바꿔 넣는
              출자전환이 대표적이다. 채권자가 원금을 포기하는 대신 회생한 회사의 지분을 받는 거래다.
            </p>
            <p className='mt-2'>
              여기 계산은 순서가 어떻게 작동하는지 보이려고 자산을 한 덩어리로 놓고 위에서부터 채웠다. 실제 파산
              절차에서 담보권자는 절차 밖에서 담보물을 처분해 회수하고, 절차 비용과 조세채권도 앞자리를 차지한다. 회생
              절차라면 계층별 동의 요건과 인가 기준이 따로 있어 순위표만으로 결과가 정해지지도 않는다.
            </p>
          </>
        }
      />
    </div>
  );
}
