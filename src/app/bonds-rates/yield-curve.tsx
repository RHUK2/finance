'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Activity, CircleCheck, LineChart, TriangleAlert } from 'lucide-react';

import {
  ControlSlider,
  CostBar,
  ExplainCard,
  Metric,
  SectionIntro,
  SegmentedControl,
  StatusBanner,
} from '@/components/simulation';
import { Card } from '@/components/ui/card';

import { curveYields, spread10y2y, TENORS, type CurveShape } from './models';

const SHAPE_LABELS: { value: CurveShape; label: string }[] = [
  { value: 'normal', label: '정상' },
  { value: 'flat', label: '평탄' },
  { value: 'inverted', label: '역전' },
];

export function YieldCurve() {
  const [shape, setShape] = useState<CurveShape>('normal');
  const [shortRate, setShortRate] = useState(3);

  const ys = curveYields(shape, shortRate);
  const spread = spread10y2y(ys);
  const inverted = spread < 0;
  const max = Math.max(...ys, 0.5);

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='만기별 금리를 한 줄로 이으면'>
        금리는 하나가 아니다. 3개월짜리와 30년짜리에 시장이 요구하는 수익률이 각각 다르고, 그것을 만기 순으로 이은 선이
        수익률 곡선이다. 보통은 오래 묶어 둘수록 더 받으니 우상향한다. 그 순서가 뒤집히는 일이 가끔 있고, 그때 시장이
        무엇을 말하고 있는지가 이 탭의 주제다. 아래 값은 세 모양을 대비해 보이려고 고정해 둔 예시이고, 지금 실제 곡선은{' '}
        <Link href='/economy' className='underline underline-offset-2'>
          경제 차트
        </Link>
        의 수익률 곡선 스프레드에서 본다.
      </SectionIntro>

      <Card className='gap-4 p-4'>
        <SegmentedControl value={shape} onChange={setShape} options={SHAPE_LABELS} />
        <ControlSlider
          icon={<Activity className='size-4 text-sky-500' />}
          label='단기금리 (중앙은행이 정하는 쪽)'
          value={shortRate}
          onChange={setShortRate}
          min={0}
          max={10}
          step={0.25}
          format={(v) => `${v.toFixed(2)}%`}
          hint='곡선의 왼쪽 끝은 정책금리를 거의 그대로 따라간다. 오른쪽 끝은 시장이 정한다.'
        />
      </Card>

      <Card className='gap-3 p-4'>
        <span className='text-sm font-medium'>만기별 수익률</span>
        {TENORS.map((t, i) => (
          <CostBar
            key={t.label}
            label={t.label}
            value={ys[i]}
            max={max}
            className={inverted ? 'bg-rose-500' : 'bg-sky-500'}
            format={(v) => `${v.toFixed(2)}%`}
          />
        ))}
      </Card>

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
        <Metric
          label='10년 − 2년'
          value={`${spread >= 0 ? '+' : '−'}${Math.abs(spread).toFixed(2)}%p`}
          tone={inverted ? 'bad' : 'good'}
          sub={inverted ? '역전 상태' : '정상 순서'}
        />
        <Metric label='2년물' value={`${ys[1].toFixed(2)}%`} sub='정책금리 전망을 반영' />
        <Metric label='10년물' value={`${ys[3].toFixed(2)}%`} sub='장기 성장·물가 전망을 반영' />
      </div>

      <StatusBanner
        tone={inverted ? 'bad' : 'good'}
        icon={inverted ? <TriangleAlert className='size-4 shrink-0' /> : <CircleCheck className='size-4 shrink-0' />}
      >
        <span className='leading-relaxed font-normal'>
          {inverted
            ? '장기금리가 단기금리보다 낮다. 시장이 앞으로 금리가 내려갈 것으로 보고 있다는 뜻이고, 금리를 내려야 할 상황이 온다는 예상이기도 하다.'
            : '오래 묶을수록 더 받는 정상 순서다. 시장이 당장의 급격한 금리 인하를 예상하지 않는다는 뜻이다.'}
        </span>
      </StatusBanner>

      <ExplainCard
        icon={<LineChart className='size-4 text-rose-500' />}
        title='역전이 왜 경기침체 신호로 불리나'
        preview='장기금리가 낮다는 것은 곧 금리를 내려야 할 일이 온다는 시장의 예상이다.'
        body='10년물 금리는 대략 앞으로 10년치 단기금리의 평균에 대한 예상이다. 그 평균이 지금의 단기금리보다 낮다는 것은, 머지않아 중앙은행이 금리를 내릴 수밖에 없는 상황이 온다고 시장이 보고 있다는 뜻이다. 금리를 내리는 상황이란 대개 경기가 식는 상황이다. 미국에서는 지난 반세기 동안 침체에 앞서 거의 예외 없이 역전이 나타났다. 다만 역전에서 침체까지의 시차가 짧게는 반년, 길게는 2년으로 들쭉날쭉해 시점을 맞히는 지표는 아니고, 역전이 있었지만 침체가 오지 않은 사례도 있다.'
      />
      <ExplainCard
        icon={<Activity className='size-4 text-sky-500' />}
        title='곡선의 양쪽 끝은 다른 사람이 정한다'
        preview='왼쪽은 중앙은행, 오른쪽은 시장이다. 둘이 어긋난 모습이 곧 곡선의 모양이다.'
        body='단기 쪽은 정책금리를 거의 그대로 따라가므로 중앙은행이 정한다고 봐도 된다. 장기 쪽은 앞으로의 성장률·물가·재정 상황에 대한 시장의 판단이 값을 만든다. 그래서 곡선의 모양은 두 주체의 견해차를 그린 그림이다. 중앙은행이 물가를 잡겠다고 단기금리를 빠르게 올리는데 시장은 그 긴축이 오래 못 갈 것으로 보면 왼쪽만 솟아 역전이 된다. 반대로 재정적자가 커져 장기 국채 공급이 몰리면 오른쪽이 밀려 올라가 곡선이 가팔라진다.'
      />
    </div>
  );
}
