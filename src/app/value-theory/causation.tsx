'use client';

import { useState } from 'react';

import { ArrowDown, Eye, Filter, Gem, Hammer, HelpCircle, Palette, Scale, Sprout } from 'lucide-react';

import { ExplainCard, MarkTable, type MarkState, SectionIntro } from '@/components/simulation';
import { Card } from '@/components/ui/card';

type Row = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  labor: MarkState;
  marginal: MarkState;
  detail: string;
};

const ROWS: Row[] = [
  {
    id: 'paradox',
    label: '물은 왜 다이아몬드보다 싼가',
    icon: Gem,
    labor: 'partial',
    marginal: 'yes',
    detail:
      '노동가치설도 답을 내놓기는 한다. 다이아몬드를 캐는 데 노동이 훨씬 많이 든다는 것이다. 그런데 그 답을 밀고 나가면 아무도 원하지 않는 땅을 아무리 오래 파도 값이 생겨야 한다. 실제로는 그렇지 않으니 노동량 위에 무언가 조건을 더 얹어야 하는데, 그 조건이 결국 살 사람의 사정이다. 한계효용은 그 사정을 처음부터 설명의 중심에 놓는다.',
  },
  {
    id: 'unsold',
    label: '3년 걸린 그림이 안 팔리면 값은 얼마인가',
    icon: Palette,
    labor: 'no',
    marginal: 'yes',
    detail:
      '노동은 3년치가 그대로 들어갔는데 값은 0이다. 노동가치설은 사회적으로 필요한 노동만 가치가 된다는 단서를 달아 이 구멍을 막지만, 어떤 노동이 필요한 노동이었는지는 팔리고 나서야 알 수 있다. 판정 기준이 결국 살 사람의 평가라면, 값을 정한 것은 처음부터 노동이 아니었다.',
  },
  {
    id: 'higher',
    label: '아무도 소비하지 않는 밭의 값은 무엇이 정하는가',
    icon: Sprout,
    labor: 'partial',
    marginal: 'yes',
    detail:
      '노동가치설은 밭에 들어간 개간 노동과 앞으로 들어갈 경작 노동으로 답한다. 그런데 같은 밭이 와인 인기에 따라 값이 몇 배로 갈리는 것은 설명하지 못한다. 귀속은 방향을 뒤집어 답한다. 밭의 값은 그 밭이 닿는 와인의 값에서 내려온다.',
  },
  {
    id: 'fit',
    label: '왜 비용과 가격은 대체로 맞아떨어지는가',
    icon: Scale,
    labor: 'yes',
    marginal: 'yes',
    detail:
      '이 행만 두 이론이 함께 맞힌다. 노동가치설은 비용이 가격을 정하니 당연하다고 답한다. 한계효용은 생존편향으로 답한다. 비용을 못 건지는 생산은 오래 못 가 사라지므로, 지금 눈에 보이는 생산만 세면 비용과 가격은 언제나 맞아 보인다. 관찰이 같으니 이 행은 두 이론을 가르지 못한다. 가르는 것은 위의 세 행이다.',
  },
];

// 두 사슬은 같은 네 마디를 정확히 뒤집어 놓은 것이다. 그리는 방향을 서로 반대로
// 하면 그 사실이 보이지 않으므로 둘 다 위에서 아래로 그리고, 갈리는 지점인 출발점만
// 표시한다.
const ARROWS = [
  {
    id: 'labor',
    title: '노동가치설',
    icon: Hammer,
    color: 'text-rose-500',
    steps: ['투입한 노동', '비용', '가치', '가격'],
    note: '노동에서 출발한다. 얼마를 들였느냐가 얼마짜리인지를 정한다.',
  },
  {
    id: 'marginal',
    title: '한계효용',
    icon: Eye,
    color: 'text-emerald-500',
    steps: ['평가하는 사람', '가격', '감당 가능한 비용', '들어가는 노동'],
    note: '평가에서 출발한다. 얼마짜리인지가 얼마까지 들여도 되는지를 정한다.',
  },
];

export function Causation() {
  const [selected, setSelected] = useState('paradox');
  const row = ROWS.find((r) => r.id === selected) ?? ROWS[0];

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='같은 세상을 두 방향으로 읽는다'>
        두 이론이 다투는 것은 어느 쪽이 원인이냐다. 노동가치설은 노동이 비용을 만들고 비용이 값을 만든다고 읽는다.
        한계효용은 사람의 평가가 값을 만들고 그 값이 얼마까지 비용을 써도 되는지를 정한다고 읽는다. 같은 네 마디를 어느
        쪽에서 출발해 읽느냐만 다른데, 그 차이로 답이 갈리는 질문들이 있다.
      </SectionIntro>

      <div className='grid gap-3 sm:grid-cols-2'>
        {ARROWS.map((a) => (
          <Card key={a.id} className='flex flex-col gap-3 p-4'>
            <span className='flex items-center gap-1.5 text-sm font-semibold'>
              <a.icon className={`size-4 ${a.color}`} />
              {a.title}
            </span>
            <div className='flex flex-col gap-1'>
              {a.steps.map((s, i) => (
                <div key={s} className='flex flex-col gap-1'>
                  <div className='flex items-center justify-between rounded-md border px-3 py-1.5 text-sm'>
                    {s}
                    {i === 0 && <span className='text-muted-foreground text-xs'>출발점</span>}
                  </div>
                  {i < a.steps.length - 1 && <ArrowDown className='text-muted-foreground mx-auto size-3' />}
                </div>
              ))}
            </div>
            <p className='text-muted-foreground text-xs/relaxed'>{a.note}</p>
          </Card>
        ))}
      </div>

      <MarkTable
        icon={<HelpCircle className='size-4 text-sky-500' />}
        title='두 이론에 같은 질문을 던져 본다'
        headers={['답이 되는가', '노동가치설', '한계효용']}
        rows={ROWS.map((r) => ({
          id: r.id,
          label: r.label,
          icon: r.icon,
          marks: [r.labor, r.marginal],
        }))}
        selected={selected}
        onSelect={setSelected}
      />

      <Card className='gap-2 p-4'>
        <span className='flex items-center gap-1.5 font-semibold'>
          <row.icon className='size-4' />
          {row.label}
        </span>
        <p className='text-muted-foreground text-sm/relaxed'>{row.detail}</p>
      </Card>

      <ExplainCard
        icon={<Filter className='size-4 text-amber-500' />}
        title='그런데 왜 노동가치설은 아직도 그럴듯한가'
        preview='살아남은 생산만 눈에 보이기 때문이다. 상관은 진짜인데 인과가 반대다.'
        body={
          <>
            <p>
              가게에 놓인 물건들을 훑어보면 값이 대체로 원가에 마진을 얹은 만큼이다. 이 관찰은 노동가치설의 가장 강한
              증거처럼 보인다. 그런데 이 관찰에는 보이지 않는 쪽이 통째로 빠져 있다. 원가를 못 건진 물건들은 이미
              가게에서 치워졌고, 그 물건을 만들던 회사는 문을 닫았다. 남은 것만 세면 비용과 값은 언제나 맞아떨어진다.
            </p>
            <p className='mt-2'>
              그래서 상관관계는 진짜다. 다만 그것을 만든 것은 비용이 값을 밀어 올리는 힘이 아니라, 값이 비용을 못 덮는
              생산을 걸러 내는 체다. 값이 먼저 정해지고 비용이 거기 맞춰 살아남거나 사라진다.
            </p>
            <p className='mt-2'>
              투입한 만큼 받아야 한다는 감각이 강한 데는 다른 이유도 있다. 그것이 공정에 관한 도덕 판단이기 때문이다.
              무엇이 정당한 값인가와 무엇이 실제 값인가는 다른 질문이고, 둘을 한 이론에 담으려 하면 둘 다 흐려진다.
            </p>
          </>
        }
      />
    </div>
  );
}
