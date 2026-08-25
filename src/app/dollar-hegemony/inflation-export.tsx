'use client';

import { Banknote, Layers, Plane } from 'lucide-react';

import { useState } from 'react';

import { ControlSlider, CostBar, ExplainCard, Metric, SectionIntro, StackedBar } from '@/components/simulation';
import { Card } from '@/components/ui/card';

import { exportLedger } from './models';

const pct = (v: number) => `${v.toFixed(2)}%`;

export function InflationExport() {
  const [issuance, setIssuance] = useState(4);
  const [outflow, setOutflow] = useState(35);

  const r = exportLedger(issuance, outflow / 100);
  const maxPressure = Math.max(r.homePressure, ...r.rows.map((x) => x.pressure), 0.01);

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='찍은 쪽이 다 뒤집어쓰지는 않는다'>
        발행국이 통화를 늘리면 물가가 오른다. 그런데 그 통화가 국경 밖에서도 쓰이면 늘어난 돈의 일부가 밖으로 흘러 나가
        국내 물가 압력이 옅어진다. 옅어진 만큼이 사라진 게 아니라 다른 나라로 건너간 것이고, 같은 금액이 들어와도 경제
        규모가 작고 환율을 방어할 수단이 적을수록 더 크게 맞는다. 발행 규모와 유출 비율, 계층별 전가 계수는 구조를
        보여주기 위한 예시 수치다.
      </SectionIntro>

      <Card className='gap-4 p-4'>
        <ControlSlider
          icon={<Banknote className='size-4' />}
          label='발행 규모'
          value={issuance}
          onChange={setIssuance}
          min={1}
          max={8}
          step={0.5}
          format={(v) => `${v.toFixed(1)}조 달러`}
          hint='한 해에 새로 풀린 달러의 양.'
        />
        <ControlSlider
          icon={<Plane className='size-4' />}
          label='국경을 넘는 몫'
          value={outflow}
          onChange={setOutflow}
          max={60}
          format={(v) => `${v}%`}
          hint='발행액 중 무역 결제와 준비자산 축적으로 미국 밖에 남는 비율. 0으로 내리면 발행국이 전부 떠안는다.'
        />
      </Card>

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
        <Metric label='발행국 물가 압력' value={pct(r.homePressure)} sub={`국내에 남은 ${r.home.toFixed(1)}조 달러`} />
        <Metric
          label='한 푼도 안 나갔다면'
          value={pct(r.closedPressure)}
          tone='accent'
          sub='기축통화가 아니었을 때의 압력'
        />
        <Metric
          label='수출된 압력'
          value={`${r.exported.toFixed(2)}%p`}
          sub={`${r.abroad.toFixed(1)}조 달러가 국경을 넘었다`}
        />
      </div>

      <Card className='gap-3 p-4'>
        <span className='flex items-center gap-1.5 text-sm font-semibold'>
          <Layers className='text-muted-foreground size-4' />
          발행된 달러가 어디에 가서 앉는가
        </span>
        <StackedBar
          total={issuance}
          segments={[
            { label: '발행국 국내', value: r.home, className: 'bg-emerald-500' },
            ...r.rows.map((x) => ({
              label: `${x.tier.label} (${x.tier.currencies})`,
              value: x.inflow,
              className: x.tier.className,
            })),
          ]}
        />
      </Card>

      <Card className='gap-3 p-4'>
        <span className='text-sm font-semibold'>같은 발행이 계층마다 다르게 도착한다</span>
        <CostBar
          label='발행국 (달러)'
          value={r.homePressure}
          max={maxPressure}
          className='bg-emerald-500'
          format={pct}
          sub='세계에서 제일 큰 경제가 흡수한다'
        />
        {r.rows.map((x) => (
          <CostBar
            key={x.tier.id}
            label={`${x.tier.label} (${x.tier.currencies})`}
            value={x.pressure}
            max={maxPressure}
            className={x.tier.className}
            format={pct}
            sub={`유입 ${x.inflow.toFixed(2)}조 달러 · 전가 계수 ${x.tier.passthrough.toFixed(1)}`}
          />
        ))}
        <p className='text-muted-foreground text-xs/relaxed'>
          원화는 신흥국 칸에 있다. 발행국보다 크게 맞지만 취약 통화만큼은 아니다. 이 자리가 실제로 무엇을 뜻하는지는
          다음 탭에서 금리로 따라간다.
        </p>
      </Card>

      <ExplainCard
        title='캉티용 효과와 무엇이 다른가'
        preview='하나는 시간차, 하나는 공간차다'
        body={
          <div className='flex flex-col gap-2'>
            <p>
              새로 만들어진 돈이 모두에게 동시에 도착하지 않는다는 관찰은 두 가지 방식으로 나타나고, 이름이 닮았지만
              다른 모델이다.
            </p>
            <p>
              캉티용 효과는 한 나라 안에서 벌어지는 시간차다. 중앙은행에서 시중은행, 대기업, 자산시장을 거쳐 마지막에야
              일반 시민에게 닿는다. 먼저 받은 쪽은 물가가 오르기 전 값으로 자산을 사고, 나중에 받은 쪽은 이미 오른 값을
              치른다. 총액은 그대로인데 구매력이 앞줄로 이동한다. 이 사슬은 이 사이트의 신용창조 페이지가 대차대조표로
              따라간다.
            </p>
            <p>
              인플레이션 수출은 국경을 넘는 공간차다. 여기서는 누가 먼저 받느냐가 아니라 누가 떠안느냐가 갈린다.
              발행국은 늘린 통화의 일부만 물가로 돌려받고 나머지는 그 통화를 쓰는 나라들이 나눠 진다. 순서가 아니라
              규모와 방어 수단이 결정한다.
            </p>
            <p>
              둘을 한 화면에 나란히 놓지 않은 이유가 이것이다. 그림이 비슷해서 같은 현상의 국내판과 국제판으로 읽히기
              쉬운데, 작동하는 축이 다르다. 한 나라 안에서는 줄을 서고, 나라들 사이에서는 크기로 갈린다.
            </p>
          </div>
        }
      />
    </div>
  );
}
