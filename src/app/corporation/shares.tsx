'use client';

import { useState } from 'react';

import { Coins, PieChart, Repeat, TrendingUp, Undo2 } from 'lucide-react';

import { ControlSlider, ExplainCard, Legend, SectionIntro, StatCard, StatusBanner } from '@/components/simulation';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// 교육용 예시 회사. 단위는 주와 원.
const FOUNDER = 5_000_000;
const ME = 1_000_000;
const OTHERS = 4_000_000;
const BASE_ISSUED = FOUNDER + ME + OTHERS;
const PRICE = 20_000;
const NET_INCOME = 10_000_000_000;
const BASE_CASH = 50_000_000_000;
const BASE_PCT = (ME / BASE_ISSUED) * 100;

const fmtShares = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}주`;
const fmtPct = (n: number) => `${n.toFixed(2)}%`;
const fmtWon = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}원`;
const fmtEok = (n: number) => `${Math.round(n / 1e8).toLocaleString('ko-KR')}억원`;

export function Shares() {
  const [newIssue, setNewIssue] = useState(0);
  const [buyback, setBuyback] = useState(0);

  const issued = BASE_ISSUED + newIssue;
  const outstanding = issued - buyback;
  const cash = BASE_CASH + newIssue * PRICE - buyback * PRICE;
  const myPct = (ME / outstanding) * 100;
  const eps = NET_INCOME / outstanding;

  // 내 지분율도 EPS도 유통주식수에 반비례하므로 두 카드의 tone은 하나로 정해진다.
  const tone = outstanding > BASE_ISSUED ? 'bad' : outstanding < BASE_ISSUED ? 'good' : undefined;

  const segments = [
    { label: '창업자', shares: FOUNDER, className: 'bg-sky-500' },
    { label: '나', shares: ME, className: 'bg-amber-500' },
    { label: '기타 주주', shares: OTHERS - buyback, className: 'bg-slate-400' },
    { label: '신규 투자자', shares: newIssue, className: 'bg-emerald-500' },
    { label: '자사주 (의결권·배당 없음)', shares: buyback, className: 'bg-muted-foreground/25' },
  ]
    .filter((s) => s.shares > 0)
    .map((s) => ({ ...s, pct: (s.shares / issued) * 100 }));

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='회사가 자기 지분의 반대편에 앉는다'>
        주식은 회사라는 인격에 대한 지분 조각이다. 회사는 새 조각을 찍어내 팔 수도 있고(신주 발행), 시장에 나와 있는
        조각을 자기 돈으로 사들일 수도 있다(자사주 매입). 사람으로 치면 자기 자신의 일부를 사고파는 셈인데, 법인이기에
        가능한 거래다. 두 손잡이를 움직여 내 지분이 어떻게 묽어지고 짙어지는지 보자.
      </SectionIntro>

      <Card className='gap-5 p-4'>
        <ControlSlider
          icon={<Coins className='size-4 text-emerald-500' />}
          label='신주 발행 (유상증자)'
          value={newIssue}
          onChange={setNewIssue}
          min={0}
          max={5_000_000}
          step={100_000}
          format={fmtShares}
          hint={`주당 ${fmtWon(PRICE)}에 새 주식을 찍어 판다. 회사 금고에 현금이 들어오지만, 파이의 조각 수가 늘어 기존 주주의 몫은 묽어진다.`}
        />
        <ControlSlider
          icon={<Undo2 className='size-4 text-amber-500' />}
          label='자사주 매입'
          value={buyback}
          onChange={setBuyback}
          min={0}
          max={3_000_000}
          step={100_000}
          format={fmtShares}
          hint='회사가 자기 돈으로 시장에서 주식을 사들인다. 회사가 쥔 자기 주식에는 의결권도 배당도 없어, 남은 주주의 몫이 그만큼 짙어진다.'
        />
      </Card>

      <Card className='gap-3 p-4'>
        <span className='flex items-center gap-1.5 text-sm font-semibold'>
          <PieChart className='size-4 text-sky-500' />
          지분 구성 (발행주식 {fmtShares(issued)})
        </span>
        <div className='bg-muted flex h-8 w-full overflow-hidden rounded-md'>
          {segments.map((s) => (
            <div key={s.label} className={cn('h-full transition-all', s.className)} style={{ width: `${s.pct}%` }} />
          ))}
        </div>
        <div className='text-muted-foreground flex flex-wrap gap-x-4 gap-y-1.5 text-xs'>
          {segments.map((s) => (
            <Legend key={s.label} className={s.className} label={`${s.label} ${s.pct.toFixed(1)}%`} />
          ))}
        </div>
      </Card>

      <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
        <StatCard label='유통주식수' value={outstanding} format={fmtShares} sub='자사주 제외' />
        <StatCard label='내 지분율' value={myPct} format={fmtPct} tone={tone} sub={`시작 ${fmtPct(BASE_PCT)}`} />
        <StatCard
          label='주당순이익 (EPS)'
          value={eps}
          format={fmtWon}
          tone={tone}
          sub={`순이익 ${fmtEok(NET_INCOME)} 고정`}
        />
        <StatCard label='회사 보유 현금' value={cash} format={fmtEok} tone={cash < 0 ? 'bad' : 'accent'} />
      </div>

      {cash < 0 && (
        <StatusBanner tone='bad'>
          매입 대금이 보유 현금을 넘어섰다. 실제로는 배당가능이익 범위 안에서만 자사주를 살 수 있다. 회사 재산을 마음껏
          주주에게 돌려주면 채권자가 기댈 담보가 사라지기 때문이다.
        </StatusBanner>
      )}

      <ExplainCard
        icon={<Repeat className='size-4 text-amber-500' />}
        title='자사주 매입은 왜 배당과 닮았고, 또 다른가'
        preview='둘 다 회사 돈을 주주에게 돌려주는 통로지만, 남는 주주의 지분율이 달라진다.'
        body={
          <>
            <p>
              배당은 모든 주주에게 현금을 똑같이 나눠 준다. 지분율은 그대로다. 자사주 매입은 팔겠다고 나선 주주에게만
              현금을 주고 그 지분을 회수한다. 팔지 않은 주주는 현금을 못 받는 대신 회사에 대한 몫이 커진다. 같은 금액을
              쓰더라도 배당은 주주 수를 유지하고, 매입은 주주 수를 줄인다.
            </p>
            <p className='mt-2'>
              회사가 쥔 자기 주식에는 의결권도 배당청구권도 없다. 자기가 자기 총회에서 표를 던지는 건 말이 안 되기
              때문이다. 그래서 자사주는 사실상 잠들어 있는 주식이고, 소각하면 그대로 사라진다. EPS가 오르는 것도 같은
              이유다. 이익이 늘어서가 아니라 나눌 조각 수가 줄었기 때문이다.
            </p>
          </>
        }
      />

      <ExplainCard
        icon={<TrendingUp className='size-4 text-emerald-500' />}
        title='희석이 항상 손해는 아니다'
        preview='조각 수가 늘어도 파이 자체가 더 커지면 내 몫의 절대 크기는 커진다.'
        body={
          <>
            <p>
              지분율만 보면 신주 발행은 언제나 손해로 보인다. 하지만 회사가 받은 돈으로 이익을 더 키운다면 이야기가
              달라진다. 10%를 가진 100억짜리 회사보다 8%를 가진 200억짜리 회사가 낫다. 판단의 기준은 지분율이 아니라
              들어온 돈이 만들어 낼 가치가 내준 지분의 값어치보다 큰가다.
            </p>
            <p className='mt-2'>
              반대로 자사주 매입도 공짜가 아니다. 회사 금고에서 현금이 빠져나가므로, 그 돈을 사업에 넣었을 때의 수익이
              주식을 되사서 얻는 이득보다 컸다면 손해다. 주가가 가치보다 비쌀 때 사들이는 매입은 파는 주주에게 남는
              주주의 돈을 넘겨주는 거래가 된다.
            </p>
          </>
        }
      />
    </div>
  );
}
