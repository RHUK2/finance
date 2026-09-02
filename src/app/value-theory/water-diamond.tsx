'use client';

import { useState } from 'react';

import { Droplets, Gem, Scale } from 'lucide-react';

import { cn, formatEokFromMan, formatMan, formatWon } from '@/lib/utils';

import {
  ControlSlider,
  Field,
  Legend,
  Metric,
  SectionIntro,
  SegmentedControl,
  StatusBanner,
} from '@/components/simulation';
import { Card } from '@/components/ui/card';

import { MAX_CUPS, SITUATIONS, type Situation, waterMarginalWon, waterTotalWon } from './models';

// 값이 수천 원에서 수억 원까지 걸쳐 있어 한 단위로는 읽히지 않는다. 새 표기를 만드는
// 게 아니라 utils의 표기 셋 중 자릿수에 맞는 것을 고를 뿐이다.
const formatValue = (won: number) =>
  won >= 1e8 ? formatEokFromMan(won / 1e4) : won >= 1e4 ? formatMan(won / 1e4) : formatWon(won);

const SITUATION_OPTIONS = (Object.keys(SITUATIONS) as Situation[]).map((k) => ({
  value: k,
  label: SITUATIONS[k].label,
}));

export function WaterDiamond() {
  const [cups, setCups] = useState(8);
  const [situation, setSituation] = useState<Situation>('city');

  const { decay, diamondWon, note } = SITUATIONS[situation];
  const marginal = waterMarginalWon(cups, decay);
  const total = waterTotalWon(cups, decay);
  const waterWins = marginal > diamondWon;

  // 막대 높이는 첫 잔을 100%로 잡는다. 다이아몬드도 같은 잣대에 올려야 비교가 된다.
  const bars = Array.from({ length: cups }, (_, i) => waterMarginalWon(i + 1, decay));
  const scale = Math.max(bars[0], diamondWon);

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='물은 왜 다이아몬드보다 싼가'>
        애덤 스미스가 던져 놓고 풀지 못한 질문이다. 물이 없으면 사람은 죽고 다이아몬드가 없으면 아무 일도 없는데, 값은
        정반대로 매겨진다. 노동가치설로는 다이아몬드를 캐는 데 노동이 더 든다고 답할 수밖에 없는데, 그러면 아무도 원하지
        않는 땅을 아무리 오래 파도 값이 생겨야 한다. 한계효용은 다르게 답한다. 값을 정하는 것은 그 재화 전체가 아니라
        마지막 한 단위다. 잔을 늘려 보면서 마지막 한 잔의 값어치가 어떻게 되는지 보자.
      </SectionIntro>

      <Card className='gap-4 p-4'>
        <ControlSlider
          icon={<Droplets className='size-4 text-sky-500' />}
          label='이미 쥐고 있는 물'
          hint='첫 잔은 마시지 못하면 죽으므로 목숨값이다. 잔이 늘수록 한 잔 더의 값어치가 떨어진다.'
          value={cups}
          onChange={setCups}
          min={1}
          max={MAX_CUPS}
          step={1}
          format={(v) => `${v}잔`}
        />
        <Field label='어디에 있는가'>
          <SegmentedControl options={SITUATION_OPTIONS} value={situation} onChange={setSituation} />
          <p className='text-muted-foreground text-xs'>{note}</p>
        </Field>
      </Card>

      <Card className='flex flex-col gap-3 p-4'>
        <span className='flex items-center gap-1.5 text-sm font-semibold'>
          <Scale className='size-4 text-amber-500' />한 단위 더의 값어치
        </span>
        <div className='flex items-end gap-4'>
          <div className='flex h-32 flex-1 items-end gap-0.5'>
            {bars.map((v, i) => (
              <div
                key={i}
                title={`${i + 1}잔째 ${formatValue(v)}`}
                // 값을 정하는 것은 마지막 한 잔이다. 그 막대가 어느 것인지 보이지 않으면
                // 옆의 다이아몬드와 무엇을 견주는 그림인지 알 수 없다.
                className={cn('min-h-px flex-1 rounded-t-sm', i === cups - 1 ? 'bg-sky-300' : 'bg-sky-500')}
                style={{ height: `${Math.max(1, (v / scale) * 100)}%` }}
              />
            ))}
          </div>
          <div className='flex h-32 w-12 items-end border-l pl-4'>
            <div
              title={`다이아몬드 ${formatValue(diamondWon)}`}
              className='w-full rounded-t-sm bg-violet-500'
              style={{ height: `${Math.max(1, (diamondWon / scale) * 100)}%` }}
            />
          </div>
        </div>
        <div className='text-muted-foreground flex flex-wrap gap-x-4 gap-y-1.5 text-xs'>
          <Legend className='bg-sky-500' label='물 앞선 잔들 (왼쪽부터 1잔째)' />
          <Legend className='bg-sky-300' label={`물 ${cups}잔째 (값을 정하는 잔)`} />
          <Legend className='bg-violet-500' label='다이아몬드 1캐럿' />
        </div>
        <p className='text-muted-foreground text-xs/relaxed'>
          다이아몬드 수량은 고정이다. 캐낼수록 흔해지는 쪽으로 만지게 두면 희소하다는 전제 자체가 무너져 역설이
          사라진다.
        </p>
      </Card>

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
        <Metric label={`물 총효용 (${cups}잔 전부)`} value={formatValue(total)} sub='첫 잔부터 지금 잔까지의 합' />
        <Metric
          label={`물 한계효용 (${cups}잔째)`}
          value={formatValue(marginal)}
          tone={waterWins ? 'good' : 'bad'}
          sub='한 잔 더 얻을 때 늘어나는 값어치'
        />
        <Metric
          label='다이아몬드 한계효용'
          value={formatValue(diamondWon)}
          sub={situation === 'desert' ? '사막에서는 당장 쓸 데가 없다' : '희소해서 다음 하나가 여전히 비싸다'}
        />
      </div>

      <StatusBanner icon={<Gem className='size-4' />} tone={waterWins ? 'good' : 'accent'}>
        {waterWins
          ? `물 ${cups}잔째가 다이아몬드보다 비싸다. 같은 물과 같은 다이아몬드인데 상황이 값을 뒤집었다.`
          : `물 총효용은 다이아몬드의 ${(total / diamondWon).toFixed(0)}배인데, 값을 정하는 ${cups}잔째는 다이아몬드보다 싸다.`}
      </StatusBanner>

      <p className='text-muted-foreground text-sm/relaxed'>
        역설은 두 숫자를 섞어 본 데서 생긴다. 스미스가 물이 다이아몬드보다 쓸모 있다고 할 때 가리킨 것은 총효용이고,
        시장에서 값이 매겨지는 것은 한계효용이다. 이름이 닮았을 뿐 다른 값이다. 그리고 그 한계효용은 물이나 다이아몬드
        안에 들어 있는 것이 아니다. 사막으로 자리를 옮기면 물건은 그대로인데 두 값이 자리를 바꾼다. 값어치는 물건이
        아니라 그것을 평가하는 사람의 사정에 붙어 있다.
      </p>
    </div>
  );
}
