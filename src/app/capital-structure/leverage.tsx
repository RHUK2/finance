'use client';

import { useState } from 'react';

import { Coins, Landmark, Percent, Scale, TrendingUp, TriangleAlert } from 'lucide-react';

import { ControlSlider, ExplainCard, Legend, Metric, SectionIntro, StatusBanner } from '@/components/simulation';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// 단위는 억원. 총자산을 1,000억으로 고정하고 그 안에서 부채와 자본의 비율만 바꾼다.
const ASSETS = 1000;
const TAX_RATE = 20;

const fmt = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}억`;
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

// 같은 자본구조를 세 업황에 넣어 보면 레버리지가 무엇을 하는지 드러난다.
const SCENARIOS = [
  { label: '호황', ebit: 200 },
  { label: '보통', ebit: 100 },
  { label: '불황', ebit: 0 },
];

// 이익이 날 때만 법인세를 매긴다. 결손금 이월공제는 넣지 않은 단순화다.
function netIncome(ebit: number, interest: number) {
  const pretax = ebit - interest;
  return pretax - Math.max(0, pretax) * (TAX_RATE / 100);
}

export function Leverage() {
  const [debtRatio, setDebtRatio] = useState(40);
  const [rate, setRate] = useState(5);
  const [ebit, setEbit] = useState(100);

  const debt = (ASSETS * debtRatio) / 100;
  const equity = ASSETS - debt;
  const interest = (debt * rate) / 100;

  const net = netIncome(ebit, interest);
  const roa = (ebit / ASSETS) * 100;
  const roe = (net / equity) * 100;
  const coverage = interest > 0 ? ebit / interest : null;

  const segments = [
    { label: '부채', value: debt, className: 'bg-rose-500' },
    { label: '자기자본', value: equity, className: 'bg-sky-500' },
  ].filter((s) => s.value > 0);

  const banner =
    coverage !== null && coverage < 1
      ? {
          tone: 'bad' as const,
          icon: <TriangleAlert className='size-4 shrink-0' />,
          text: `영업이익 ${fmt(ebit)}으로 이자 ${fmt(interest)}조차 감당하지 못한다. 이자는 실적과 무관하게 약속된 금액이라, 못 내는 순간 채권자가 회사의 운명을 쥔다.`,
        }
      : roa > rate
        ? {
            tone: 'good' as const,
            icon: <TrendingUp className='size-4 shrink-0' />,
            text: `자산이 벌어들이는 수익률 ${fmtPct(roa)}이 빌린 돈의 값 ${fmtPct(rate)}보다 높다. 남는 차익이 전부 주주 몫으로 쌓여 ROE가 ROA를 넘어선다.`,
          }
        : {
            tone: 'accent' as const,
            icon: <Percent className='size-4 shrink-0' />,
            text: `자산 수익률 ${fmtPct(roa)}이 이자율 ${fmtPct(rate)}에 못 미친다. 빌린 돈이 자기 이자도 못 벌어 오는 상태라, 레버리지가 오히려 주주 수익률을 끌어내린다.`,
          };

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='같은 자산, 다른 조달'>
        회사가 굴리는 자산 1,000억은 그대로 두고 그 돈을 어디서 가져왔는지만 바꿔 보자. 빌려 온 돈에는 실적과 무관하게
        정해진 이자를 줘야 하고, 주주가 낸 돈에는 약속된 대가가 없다. 이 비대칭이 자본구조를 고르는 이유의 거의 전부다.
        부채 비중을 움직이면 주주가 가져가는 몫이 어떻게 증폭되는지 보인다.
      </SectionIntro>

      <Card className='gap-5 p-4'>
        <ControlSlider
          icon={<Scale className='size-4 text-rose-500' />}
          label='부채 비중'
          value={debtRatio}
          onChange={setDebtRatio}
          min={0}
          max={80}
          step={5}
          format={(v) => `${v}%`}
          hint={`총자산 ${fmt(ASSETS)} 가운데 ${fmt(debt)}을 빌리고 나머지 ${fmt(equity)}을 주주가 댄다.`}
        />
        <ControlSlider
          icon={<Landmark className='size-4 text-amber-500' />}
          label='차입 이자율'
          value={rate}
          onChange={setRate}
          min={2}
          max={12}
          step={0.5}
          format={(v) => `${v.toFixed(1)}%`}
          hint='부채가 늘수록 채권자가 요구하는 금리도 함께 오르지만, 여기서는 둘을 따로 움직여 각각의 효과를 본다.'
        />
        <ControlSlider
          icon={<Coins className='size-4 text-emerald-500' />}
          label='영업이익'
          value={ebit}
          onChange={setEbit}
          min={-50}
          max={250}
          step={10}
          format={fmt}
          hint='이자와 세금을 빼기 전, 자산이 사업으로 벌어들인 돈이다. 자본구조와는 무관하게 결정된다.'
        />
      </Card>

      <Card className='gap-3 p-4'>
        <span className='flex items-center gap-1.5 text-sm font-semibold'>
          <Scale className='size-4 text-sky-500' />
          자산 {fmt(ASSETS)}은 어디서 왔는가
        </span>
        <div className='bg-muted flex h-8 w-full overflow-hidden rounded-md'>
          {segments.map((s) => (
            <div
              key={s.label}
              className={cn('h-full transition-all', s.className)}
              style={{ width: `${(s.value / ASSETS) * 100}%` }}
            />
          ))}
        </div>
        <div className='text-muted-foreground flex flex-wrap gap-x-4 gap-y-1.5 text-xs'>
          {segments.map((s) => (
            <Legend key={s.label} className={s.className} label={`${s.label} ${fmt(s.value)}`} />
          ))}
        </div>
      </Card>

      <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
        <Metric label='ROA (자산 수익률)' value={fmtPct(roa)} sub='자본구조와 무관' />
        <Metric
          label='ROE (자기자본 수익률)'
          value={fmtPct(roe)}
          tone={roe > roa ? 'good' : roe < 0 ? 'bad' : 'accent'}
          sub={`자기자본 ${fmt(equity)} 기준`}
        />
        <Metric
          label='이자보상배율'
          value={coverage === null ? '무한' : `${coverage.toFixed(1)}배`}
          tone={coverage === null ? 'good' : coverage < 1 ? 'bad' : coverage < 3 ? 'accent' : 'good'}
          sub='영업이익 ÷ 이자비용'
        />
        <Metric
          label='주주 몫 순이익'
          value={fmt(net)}
          tone={net < 0 ? 'bad' : undefined}
          sub={`이자 ${fmt(interest)}`}
        />
      </div>

      <StatusBanner tone={banner.tone} icon={banner.icon}>
        {banner.text}
      </StatusBanner>

      <Card className='gap-0 overflow-hidden p-0'>
        <div className='flex flex-col gap-1 p-4'>
          <span className='flex items-center gap-1.5 text-sm font-semibold'>
            <TrendingUp className='size-4 text-amber-500' />
            업황이 바뀌면 격차가 드러난다
          </span>
          <span className='text-muted-foreground text-xs'>
            부채 비중 {debtRatio}%인 지금 회사와, 빚이 한 푼도 없는 같은 회사의 ROE를 나란히 놓았다
          </span>
        </div>
        <div className='text-muted-foreground grid grid-cols-[1fr_5rem_5rem] gap-x-2 border-y px-4 py-2 text-xs'>
          <span>영업이익</span>
          <span className='text-right'>무차입</span>
          <span className='text-right'>부채 {debtRatio}%</span>
        </div>
        {SCENARIOS.map((s) => {
          const levered = (netIncome(s.ebit, interest) / equity) * 100;
          const unlevered = (netIncome(s.ebit, 0) / ASSETS) * 100;
          return (
            <div
              key={s.label}
              className='grid grid-cols-[1fr_5rem_5rem] gap-x-2 border-b px-4 py-2.5 text-sm last:border-b-0'
            >
              <span>
                {s.label}
                <span className='text-muted-foreground ml-1.5 text-xs tabular-nums'>{fmt(s.ebit)}</span>
              </span>
              <span className='text-muted-foreground text-right tabular-nums'>{fmtPct(unlevered)}</span>
              <span
                className={cn(
                  'text-right font-medium tabular-nums',
                  levered > unlevered && 'text-emerald-600 dark:text-emerald-400',
                  levered < unlevered && 'text-rose-600 dark:text-rose-400',
                )}
              >
                {fmtPct(levered)}
              </span>
            </div>
          );
        })}
      </Card>

      <ExplainCard
        icon={<TrendingUp className='size-4 text-amber-500' />}
        title='레버리지는 수익을 만들지 않는다'
        preview='빌린 돈은 결과의 폭을 넓힐 뿐, 사업이 버는 힘 자체를 키우지는 않는다.'
        body={
          <>
            <p>
              위 표에서 무차입 회사의 ROE는 업황에 따라 완만하게 움직이지만, 빚을 진 회사는 같은 영업이익 변화에 훨씬
              크게 흔들린다. 이자가 고정된 금액이기 때문이다. 영업이익에서 먼저 정해진 몫이 빠져나가고 나머지 전부가
              주주에게 가므로, 위쪽으로도 아래쪽으로도 진폭이 커진다. 레버리지를 지렛대라고 부르는 건 힘을 만들어서가
              아니라 같은 힘을 증폭하기 때문이다.
            </p>
            <p className='mt-2'>
              그래서 판단의 기준은 하나로 좁혀진다. 자산이 벌어들이는 수익률이 빌린 돈의 값보다 높은가. 높으면 차액이
              주주에게 쌓이고, 낮으면 주주가 그 차액을 메운다. 문제는 이 비교가 사후에만 확실하다는 점이다. 이자율은
              계약으로 미리 정해지지만 자산 수익률은 해 봐야 안다.
            </p>
          </>
        }
      />

      <ExplainCard
        icon={<TriangleAlert className='size-4 text-rose-500' />}
        title='주주에게 유한책임이 있다는 사실이 여기서 작동한다'
        preview='아래쪽 손실이 출자금에서 끊기니, 주주에게는 위험을 키울 유인이 남는다.'
        body={
          <>
            <p>
              주주가 잃을 수 있는 최대치는 낸 돈까지다. 위쪽 이익에는 한도가 없다. 이 비대칭 때문에 부채가 많은 회사의
              주주는 위험한 사업을 선호하게 된다. 잘되면 이자를 갚고 남는 전부가 자기 몫이고, 잘못돼도 이미 잃을 것이
              정해져 있기 때문이다. 손실의 뒷부분은 채권자가 진다.
            </p>
            <p className='mt-2'>
              채권자도 이 사실을 알기에 계약으로 미리 막는다. 부채비율이나 이자보상배율의 하한을 정해 두고 어기면 즉시
              상환을 요구하는 재무약정, 배당과 추가 차입을 제한하는 조항, 자산에 잡는 담보가 모두 그런 장치다. 자본구조
              선택은 숫자놀음이 아니라 채권자와 주주가 서로를 어디까지 믿을지 정하는 협상이다.
            </p>
          </>
        }
      />
    </div>
  );
}
