'use client';

import { useMemo, useState } from 'react';

import { Bomb, Crown, HeartPulse, ShieldAlert, ShieldCheck, Zap } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { ControlSlider, CostBar, ExplainCard, Metric, SectionIntro, StatusBanner } from '@/components/simulation';
import { bcraLabel } from '@/lib/bcra';
import { cn, formatUsd } from '@/lib/utils';

import { powerCapture } from './models';

export function AbstractVsPhysical() {
  const [value, setValue] = useState(1e9);
  const [abstractDefense, setAbstractDefense] = useState(5e6);
  const [physicalWall, setPhysicalWall] = useState(2e9);

  const r = useMemo(
    () => powerCapture({ value, abstractDefense, physicalWall }),
    [value, abstractDefense, physicalWall],
  );

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='추상 권력 vs 물리 권력: 약탈자는 어디를 노리는가'>
        권력에는 두 종류가 있다. <b>추상 권력</b>은 위계·신뢰·직위처럼 믿음 위에 세워져 휘두르긴 싸지만, 약탈자가 적은
        비용으로 탈취할 수 있다. <b>물리 권력</b>은 실제 와트를 소비해 부과하는 비용이라 비싸지만, 자산 가치보다 더 많은
        에너지를 쏟아야만 뺏을 수 있게 만든다. 합리적 약탈자는 탈취 이득이 비용보다 클 때만 공격한다. 로워리는 이 비율을{' '}
        <b>BCRA</b>(공격 이득 ÷ 공격 비용)라 부르고, 1 미만이면 공격이 비합리가 되어 방어에 성공한 것으로 본다.
      </SectionIntro>

      <Card className='gap-4 p-4'>
        <ControlSlider
          label='자원 가치'
          hint='약탈자가 탈취해 얻는 이득. 클수록 매력적인 표적이 된다.'
          value={value}
          onChange={setValue}
          min={1e7}
          max={1e13}
          scale='log'
          format={formatUsd}
        />
        <ControlSlider
          icon={<Crown className='size-4 text-rose-500' />}
          label='추상 권력 탈취 비용'
          hint='위계·신뢰를 매수·기만·강압해 장악하는 비용. 자산 가치에 비례하지 않고 낮게 고정된다.'
          value={abstractDefense}
          onChange={setAbstractDefense}
          min={1e5}
          max={1e9}
          scale='log'
          format={formatUsd}
        />
        <ControlSlider
          icon={<Zap className='size-4 text-amber-500' />}
          label='물리 권력 벽 (부과한 와트)'
          hint='탈취하려면 쏟아야 하는 실제 에너지 비용. 자산 가치 위로 올리면 공격이 비합리가 된다.'
          value={physicalWall}
          onChange={setPhysicalWall}
          min={1e7}
          max={1e13}
          scale='log'
          format={formatUsd}
        />
      </Card>

      <div className='grid gap-3 sm:grid-cols-2'>
        <RegimeCard
          title='추상 권력'
          icon={<Crown className='size-4 text-rose-500' />}
          value={value}
          cost={r.abstract.cost}
          ratio={r.abstract.bcra}
          captured={r.abstract.captured}
        />
        <RegimeCard
          title='물리 권력'
          icon={<Zap className='size-4 text-amber-500' />}
          value={value}
          cost={r.physical.cost}
          ratio={r.physical.bcra}
          captured={r.physical.captured}
        />
      </div>

      <Card
        className={cn(
          'flex-row items-start gap-3 p-4',
          r.physical.captured ? 'border-rose-500/40 bg-rose-500/5' : 'border-emerald-500/40 bg-emerald-500/5',
        )}
      >
        <ShieldCheck className={cn('size-5 shrink-0', r.physical.captured ? 'text-rose-500' : 'text-emerald-500')} />
        <p className='text-sm/relaxed'>
          추상 권력의 탈취 비용은 자산 가치가 아무리 커져도 함께 오르지 않는다. 그래서 고가치 자산일수록 BCRA가 치솟아{' '}
          <b>늘 탈취에 노출</b>된다. 반면 물리 권력은 와트를 부과해 탈취 비용을 자산 가치 위로 끌어올릴 수 있다.{' '}
          {r.physical.captured ? (
            <>
              지금은 물리 권력 벽이 자원 가치보다 낮아 여전히 탈취된다. 벽을 가치 위로 올려 보면 BCRA가 1 미만으로
              떨어진다.
            </>
          ) : (
            <>
              지금은 물리 권력 벽이 자원 가치를 넘어 BCRA가 1 미만이다. 합리적 약탈자라면 공격을 포기한다. 이것이
              소프트워가 말하는 탈취 불가능성이다.
            </>
          )}
        </p>
      </Card>

      <Card className='gap-3 p-4'>
        <div>
          <h3 className='font-semibold'>같은 벽, 다른 대가</h3>
          <p className='text-muted-foreground mt-1 text-sm/relaxed'>
            탈취 비용의 벽을 세우는 매개체는 역사적으로 군대(영토) → 핵무기(상호확증파괴) → 작업증명(전기)으로 바뀌어
            왔다. 로워리는 앞의 둘을 유혈 권력 투사(하드워), 마지막을 유혈 없는 권력 투사(소프트워)라 부르며 후자가 같은
            억지를 인명 피해 없이 달성한다고 주장한다.
          </p>
        </div>
        <div className='grid gap-3 sm:grid-cols-2'>
          <div className='flex flex-col gap-1.5 rounded-md border p-3'>
            <span className='flex items-center gap-1.5 text-sm font-semibold'>
              <Bomb className='size-4 text-rose-500' />
              하드워
            </span>
            <p className='text-muted-foreground text-xs/relaxed'>
              벽을 높이려면 무력을 키워야 하고, 억지가 실패하면 인명과 자산이 실제로 파괴된다. 벽의 크기와 부수 피해가
              함께 커진다.
            </p>
          </div>
          <div className='flex flex-col gap-1.5 rounded-md border p-3'>
            <span className='flex items-center gap-1.5 text-sm font-semibold'>
              <HeartPulse className='size-4 text-emerald-500' />
              소프트워
            </span>
            <p className='text-muted-foreground text-xs/relaxed'>
              벽을 높이려면 전기를 더 태우면 된다. 억지가 실패해도 파괴되는 건 공격자가 쏟은 에너지뿐이다. 대신 벽을
              유지하는 동안 전력을 계속 소비한다.
            </p>
          </div>
        </div>
        <p className='text-muted-foreground text-xs/relaxed'>
          이 대비는 로워리의 주장이며 학계에서 널리 받아들여진 결론은 아니다. 작업증명이 국가 간 무력 억지를 실제로
          대체할 수 있는지는 논쟁 중이다.
        </p>
      </Card>

      <ExplainCard
        title='왜 비트코인은 물리 권력인가'
        preview='명목화폐는 소수만 포섭하면 장악되지만, 비트코인은 전 세계 전력을 넘어야 한다.'
        body='명목 화폐·중앙화 시스템의 통제권은 추상 권력이라, 권한을 쥔 소수를 포섭하면 통째로 장악할 수 있다. 비트코인의 통제권은 작업증명으로 부과한 와트 위에 있어, 장악하려면 전 세계 채굴 전력을 능가하는 실제 에너지를 쏟아야 한다. 추상 권력의 약점을 물리적 비용으로 메우는 것이 소프트워의 핵심이다.'
      />
    </div>
  );
}

function RegimeCard({
  title,
  icon,
  value,
  cost,
  ratio,
  captured,
}: {
  title: string;
  icon: React.ReactNode;
  value: number;
  cost: number;
  ratio: number;
  captured: boolean;
}) {
  const max = Math.max(value, cost);
  return (
    <Card className='gap-3 p-4'>
      <span className='flex items-center gap-1.5 text-sm font-semibold'>
        {icon}
        {title}
      </span>
      <CostBar label='탈취 이득 (자원 가치)' value={value} max={max} className='bg-amber-500' />
      <CostBar label='탈취 비용' value={cost} max={max} className='bg-sky-500' />
      <Metric
        label='BCRA (이득÷비용)'
        value={bcraLabel(ratio)}
        tone={captured ? 'bad' : 'good'}
        sub='1 미만이면 방어'
      />
      <StatusBanner
        icon={captured ? <ShieldAlert className='size-4' /> : <ShieldCheck className='size-4' />}
        tone={captured ? 'bad' : 'good'}
      >
        {captured ? '탈취됨' : '방어됨'}
      </StatusBanner>
    </Card>
  );
}
