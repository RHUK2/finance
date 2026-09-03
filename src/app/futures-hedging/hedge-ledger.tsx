'use client';

import { useState } from 'react';

import { Fuel, Percent, Users } from 'lucide-react';

import { ControlSlider, ExplainCard, Metric, SectionIntro, StackedBar, StatusBanner } from '@/components/simulation';
import { Card } from '@/components/ui/card';

import { FUTURES_PRICE, PRODUCER_BARRELS, REFINER_BARRELS, SPOT_NOW, hedgeLedger } from './models';

const usd = (n: number) => `$${n.toFixed(2)}`;
const pct = (n: number) => `${Math.round(n * 100)}%`;
const mb = (n: number) => `${(n / 1_000_000).toFixed(2)}M 배럴`;

export function HedgeLedger() {
  const [settle, setSettle] = useState(60);
  const [hedgeRatio, setHedgeRatio] = useState(1);
  const [speculators, setSpeculators] = useState(0.6);

  const l = hedgeLedger(hedgeRatio, settle, speculators);
  const distortion = l.effectiveFutures - FUTURES_PRICE;
  const gain = l.producerEffective - l.producerNaked;

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='헤저는 가격을 맞히려 하지 않는다'>
        지금 원유 현물은 배럴당 {usd(SPOT_NOW)}, 3개월물 계약가는 {usd(FUTURES_PRICE)}다. 산유국은 3개월 뒤{' '}
        {mb(PRODUCER_BARRELS)}을 팔 예정이고 정유사는 {mb(REFINER_BARRELS)}을 살 예정이다. 만기 가격을 어디로 밀어 보든
        산유국의 실효 판매단가가 거의 움직이지 않는 걸 확인하고, 그다음 그 안 움직임이 어디서 왔는지를 보자. 가격 위험은
        지워진 게 아니라 정유사와 투기자의 장부로 넘어가 있다.
      </SectionIntro>

      <Card className='gap-4 p-4'>
        <ControlSlider
          icon={<Fuel className='size-4 text-amber-500' />}
          label='만기 시점 유가'
          hint='3개월 뒤 원유 현물이 실제로 얼마가 됐는지. 계약가보다 낮으면 산유국이 현물에서 손해를 보고 선물에서 그만큼 번다.'
          value={settle}
          onChange={setSettle}
          min={40}
          max={120}
          step={1}
          format={usd}
        />
        <ControlSlider
          icon={<Percent className='size-4 text-sky-500' />}
          label='산유국 헤지 비율'
          hint='팔 물량 중 선물로 잠그려는 비율. 100%가 언제나 정답은 아니다. 가격이 오를 것 같으면 일부만 잠그고 나머지로 상승을 받는다.'
          value={hedgeRatio}
          onChange={setHedgeRatio}
          min={0}
          max={1}
          step={0.05}
          format={pct}
        />
        <ControlSlider
          icon={<Users className='size-4 text-violet-500' />}
          label='투기자 비중'
          hint='실물 없이 위험을 받아 주는 쪽이 시장에 얼마나 있는지. 정유사가 받아 주고 남은 물량은 투기자가 받아야 하며, 투기자가 적으면 그 물량은 아예 체결되지 않는다.'
          value={speculators}
          onChange={setSpeculators}
          min={0}
          max={0.95}
          step={0.05}
          format={pct}
        />
      </Card>

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
        <Metric
          label='산유국 실효 판매단가'
          value={usd(l.producerEffective)}
          tone={gain > 0.5 ? 'good' : gain < -0.5 ? 'bad' : undefined}
          sub={`헤지를 안 했다면 ${usd(l.producerNaked)}`}
        />
        <Metric
          label='헤지 체결률'
          value={pct(l.fillRate)}
          tone={l.fillRate > 0.9 ? 'good' : l.fillRate < 0.8 ? 'bad' : undefined}
          sub={l.unfilled > 0 ? `${mb(l.unfilled)}이 상대를 못 찾음` : '넘기려 한 물량이 모두 체결됨'}
        />
        <Metric
          label='베이시스'
          value={`+${usd(distortion).slice(1)}`}
          tone={distortion > 2 ? 'bad' : undefined}
          sub={`계약가 ${usd(FUTURES_PRICE)}가 ${usd(l.effectiveFutures)}로 밀렸다`}
        />
      </div>

      <Card className='gap-3 p-4'>
        <span className='text-sm font-semibold'>{mb(PRODUCER_BARRELS)}에 붙은 가격 위험은 어디로 갔나</span>
        <StackedBar
          total={PRODUCER_BARRELS}
          segments={[
            {
              label: `산유국이 계속 짐 ${mb(PRODUCER_BARRELS - l.matched - l.toSpeculators)}`,
              value: PRODUCER_BARRELS - l.matched - l.toSpeculators,
              className: 'bg-amber-500',
            },
            { label: `정유사가 받음 ${mb(l.matched)}`, value: l.matched, className: 'bg-sky-500' },
            { label: `투기자가 받음 ${mb(l.toSpeculators)}`, value: l.toSpeculators, className: 'bg-violet-500' },
          ]}
        />
        <p className='text-muted-foreground text-xs'>
          헤지 비율을 올리면 노란 몫이 줄고 파란·보라 몫이 늘어난다. 총량은 그대로다. 정유사 몫이 {mb(REFINER_BARRELS)}
          에서 멈추는 것은 그게 정유사가 실제로 사려는 전부이기 때문이고, 그 위로 넘어가는 물량은 전부 투기자를 거쳐야
          한다.
        </p>
      </Card>

      <StatusBanner tone={l.fillRate < 0.8 ? 'bad' : Math.abs(gain) > 0.5 ? 'accent' : 'good'}>
        {l.fillRate < 0.8
          ? `투기자가 부족해 ${mb(l.unfilled)}이 상대를 찾지 못했다. 그 물량의 위험은 산유국에 그대로 남아 실효 단가가 ${usd(l.producerEffective)}로 흔들린다.`
          : settle < FUTURES_PRICE
            ? `유가가 ${usd(settle)}까지 빠졌지만 산유국은 ${usd(l.producerEffective)}에 판 효과를 얻었다. 그 차액은 정유사와 투기자가 선물에서 배럴당 ${usd(Math.abs(l.producerFutures / PRODUCER_BARRELS))}를 물어 준 것이다.`
            : `유가가 ${usd(settle)}까지 올랐지만 산유국은 ${usd(l.producerEffective)}밖에 받지 못했다. 헤지는 하락을 막는 대신 상승도 같이 포기하는 거래다.`}
      </StatusBanner>

      <ExplainCard
        title='투기자는 좋은 쪽인가 나쁜 쪽인가'
        preview='둘 다 아니다. 몇 명이나 있는지가 문제일 뿐이다.'
        body='투기자 비중을 왼쪽 끝으로 밀면 헤지가 아예 체결되지 않는다. 산유국이 위험을 넘기고 싶어도 받아 줄 상대가 없기 때문이다. 오른쪽 끝으로 밀면 체결은 잘 되지만 선물이 현물에서 벌어진다. 이때 값이 어디로 가는지를 눈여겨보자. 산유국의 실효 판매단가는 올라가고 정유사의 실효 매입단가도 같이 올라간다. 괴리는 손실이 아니라 파는 쪽에서 사는 쪽으로 건너가는 이전이다. 그럼에도 이것을 나쁘다고 표시하는 이유는 두 헤저가 계획의 근거로 삼는 가격이 실제 수급에서 떨어져 나가기 때문이다. 체결률은 투기자가 많을수록 한 방향으로 좋아지고 베이시스는 한 방향으로 벌어진다. 어느 쪽도 그 자체로 투기자를 좋거나 나쁘게 만들지 않는다. 이 페이지가 투기자를 선악으로 부르지 않고 몇 명이나 있는지로만 다루는 이유가 이것이다.'
      />
    </div>
  );
}
