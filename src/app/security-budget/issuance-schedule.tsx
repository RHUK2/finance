'use client';

import { useMemo, useState } from 'react';

import { Coins, Hourglass } from 'lucide-react';

import { ExplainCard, ControlSlider, Metric, SectionIntro, Sparkline, StackedBar } from '@/components/simulation';
import { Card } from '@/components/ui/card';

import { cumulativeSupply, eraStartYear, LAST_SUBSIDY_ERA, subsidyAt, BLOCKS_PER_YEAR } from './models';

const MAX_SUPPLY = 21_000_000;

const fmtBtc = (n: number) => (n >= 1 ? `${n.toFixed(3)} BTC` : `${Math.round(n * 1e8).toLocaleString('ko-KR')} sat`);
const fmtSupply = (n: number) => `${Math.round(n).toLocaleString('ko-KR')} BTC`;

export function IssuanceSchedule() {
  const [era, setEra] = useState(4);

  const eras = useMemo(() => Array.from({ length: LAST_SUBSIDY_ERA + 2 }, (_, i) => i), []);
  const subsidies = useMemo(() => eras.map((e) => subsidyAt(e)), [eras]);
  const supplies = useMemo(() => eras.map((e) => cumulativeSupply(e)), [eras]);

  const subsidy = subsidyAt(era);
  const issued = cumulativeSupply(era);
  const remaining = Math.max(0, MAX_SUPPLY - issued);
  const annual = subsidy * BLOCKS_PER_YEAR;

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='보조금은 프로토콜이 정해 둔 대로만 줄어든다'>
        블록 보조금은 210,000블록(약 4년)마다 정확히 반으로 잘린다. 시장도 채굴자도 개입할 수 없고, 사토시가 코드에 적어
        둔 수열을 따라갈 뿐이다. 슬라이더로 시대를 밀어 보면 이 수열이 얼마나 빨리 0에 붙는지 보인다. 32번째 반감기를
        지나면 보조금은 1사토시 미만이 되어 정수 계산에서 0이 된다.
      </SectionIntro>

      <Card className='gap-4 p-4'>
        <ControlSlider
          icon={<Hourglass className='size-4 text-sky-500' />}
          label='반감기 시대'
          value={era}
          onChange={setEra}
          min={0}
          max={LAST_SUBSIDY_ERA + 1}
          step={1}
          format={(v) => `${v}번째 · ${eraStartYear(v)}년~`}
          hint={era === 4 ? '지금은 2024년 반감기 이후 시대다.' : undefined}
        />
      </Card>

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
        <Metric
          label='블록 보조금'
          value={subsidy > 0 ? fmtBtc(subsidy) : '0'}
          tone={subsidy > 0 ? 'accent' : 'bad'}
          sub={subsidy > 0 ? '한 블록을 캔 대가' : '더 이상 새 코인이 없다'}
        />
        <Metric label='연간 신규 발행' value={annual >= 1 ? fmtSupply(annual) : fmtBtc(annual)} sub='52,560블록 기준' />
        <Metric
          label='누적 공급'
          value={fmtSupply(issued)}
          sub={`상한의 ${((issued / MAX_SUPPLY) * 100).toFixed(2)}%`}
        />
      </div>

      <Card className='gap-3 p-4'>
        <div className='flex items-baseline justify-between'>
          <span className='text-sm font-medium'>2,100만 개 중 지금까지</span>
          <span className='text-xs text-muted-foreground'>{eraStartYear(era)}년 기준</span>
        </div>
        <StackedBar
          segments={[
            { label: `발행됨 ${fmtSupply(issued)}`, value: issued, className: 'bg-amber-500' },
            { label: `남음 ${fmtSupply(remaining)}`, value: remaining, className: 'bg-muted-foreground/30' },
          ]}
          total={MAX_SUPPLY}
        />
      </Card>

      <Card className='gap-3 p-4'>
        <span className='text-sm font-medium'>시대별 궤적</span>
        <Sparkline values={subsidies} label='보조금' className='text-amber-500' cursor={era} min={0} />
        <Sparkline values={supplies} label='누적 공급' className='text-sky-500' cursor={era} min={0} max={MAX_SUPPLY} />
        <p className='text-xs text-muted-foreground'>
          두 곡선은 같은 사실의 앞뒤다. 보조금이 절반씩 잘리므로 누적 공급은 상한에 점점 느리게 다가간다. 2032년이면
          이미 상한의 98%가 발행돼 있고, 남은 2%를 100여 년에 걸쳐 나눠 준다.
        </p>
      </Card>

      <ExplainCard
        icon={<Coins className='size-4 text-amber-500' />}
        title='2,100만이라는 숫자는 어디서 나오나'
        preview='목표로 정한 수가 아니라 50 BTC로 시작하는 등비수열의 합이다.'
        body='상한을 먼저 정하고 발행량을 거기 맞춘 것이 아니다. 블록당 50 BTC로 시작해 210,000블록마다 반으로 자르는 규칙을 정하면, 그 무한등비급수의 합이 50 × 210,000 × 2 = 21,000,000이 된다. 2,100만은 규칙이 낳은 결과지 입력값이 아니다. 실제로는 사토시 단위 정수 나눗셈에서 버림이 생겨 상한보다 아주 조금 모자라게 끝나고, 초기 블록의 실수와 영영 잠긴 코인까지 세면 실제 유통량은 그보다 더 적다.'
      />
      <ExplainCard
        icon={<Hourglass className='size-4 text-sky-500' />}
        title='2140년이 왜 분기점으로 불리나'
        preview='그 무렵 보조금이 0이 되어, 채굴자 수입이 수수료 하나만 남는다.'
        body='32번째 반감기를 지나면 보조금은 1사토시 미만이 되어 더 나눌 수 없고, 그 뒤 블록은 보조금 없이 발행된다. 시점은 대략 2140년이지만 정확한 해는 중요하지 않다. 진짜 분기점은 보조금이 0이 되는 순간이 아니라, 보조금이 채굴자 수입에서 차지하는 몫이 무의미해지는 시점이다. 반감기마다 절반씩 줄므로 그 시점은 2140년보다 수십 년 앞서 온다. 다음 탭에서 그 몫을 직접 본다.'
      />
    </div>
  );
}
