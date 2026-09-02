'use client';

import { ArrowUp, Cigarette, Grape, Sprout, Wine } from 'lucide-react';

import { ExplainCard, SectionIntro } from '@/components/simulation';
import { Card } from '@/components/ui/card';

// 멩거의 재화 차수. 소비에 가장 가까운 쪽이 1차재이고, 거기서 멀어질수록 차수가 올라간다.
const CHAIN = [
  {
    order: '1차재',
    label: '와인 한 병',
    icon: Wine,
    color: 'text-rose-500',
    note: '사람이 직접 마신다. 값어치가 여기서 생긴다.',
  },
  {
    order: '2차재',
    label: '포도 1kg',
    icon: Grape,
    color: 'text-violet-500',
    note: '마실 수 없다. 와인이 되기 때문에만 값이 있다.',
  },
  {
    order: '3차재',
    label: '포도밭 1,000평',
    icon: Sprout,
    color: 'text-emerald-500',
    note: '마실 수도 먹을 수도 없다. 포도를 통해서만 와인에 닿는다.',
  },
];

const YEARS = [
  { key: 'up', label: '와인이 인기를 끈 해', wine: '40,000원', grape: '6,000원', field: '3,000만원' },
  { key: 'down', label: '와인이 외면받은 해', wine: '12,000원', grape: '1,200원', field: '600만원' },
];

export function Imputation() {
  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='아무도 마시지 않는 밭의 값은 어디서 오나'>
        포도밭은 그 자체로 아무 쓸모가 없다. 밭을 씹어 먹을 수 없고 포도알을 병에 담아 팔 수도 없다. 그런데도 밭에는
        값이 붙는다. 멩거는 재화에 차수를 매겨 이걸 설명했다. 사람이 직접 소비하는 것이 1차재이고, 그것을 만드는 데
        쓰이는 것이 그 위의 고차재다. 고차재에는 자기 값어치가 없고, 아래에서 올라온 값을 나눠 가질 뿐이다. 이 흐름을
        귀속이라 부른다.
      </SectionIntro>

      <Card className='flex flex-col gap-3 p-4'>
        <span className='text-sm font-semibold'>귀속: 값어치는 아래에서 위로 올라온다</span>
        <div className='flex items-stretch gap-3'>
          <div className='flex w-8 shrink-0 items-center justify-center rounded-md border border-dashed'>
            <ArrowUp className='text-muted-foreground size-4' />
          </div>
          <div className='flex flex-1 flex-col-reverse gap-2'>
            {CHAIN.map((c) => (
              <div key={c.label} className='flex items-start gap-3 rounded-md border p-3'>
                <c.icon className={`mt-0.5 size-4 shrink-0 ${c.color}`} />
                <div className='flex flex-col'>
                  <span className='text-muted-foreground text-xs tabular-nums'>{c.order}</span>
                  <span className='text-sm font-medium'>{c.label}</span>
                  <span className='text-muted-foreground text-xs/snug'>{c.note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className='text-muted-foreground text-xs/relaxed'>
          밭에서 포도로, 포도에서 와인으로 물건이 흐르는 방향과 값어치가 정해지는 방향이 반대다. 물건은 위에서 내려오고
          값어치는 아래에서 올라온다.
        </p>
      </Card>

      <Card className='flex flex-col gap-3 p-4'>
        <span className='text-sm font-semibold'>같은 밭, 같은 노동, 다른 값</span>
        <div className='grid grid-cols-[1fr_auto_auto] items-center gap-x-3 gap-y-2 text-sm sm:gap-x-6'>
          <span className='text-muted-foreground text-xs' />
          {YEARS.map((y) => (
            <span key={y.key} className='text-muted-foreground text-right text-xs'>
              {y.label}
            </span>
          ))}
          {(['wine', 'grape', 'field'] as const).map((row, i) => (
            <ChainRow key={row} label={CHAIN[i].label} values={YEARS.map((y) => y[row])} />
          ))}
        </div>
        <p className='text-muted-foreground text-xs/relaxed'>
          두 해의 밭은 같은 밭이고 들어간 노동도 같다. 그런데 값이 다섯 배 갈린다. 노동이 값을 정한다면 이 표는 나올 수
          없다. 값을 정한 것은 와인을 마실 사람의 사정이고, 그 판정이 포도를 거쳐 밭까지 올라온 것이다.
        </p>
      </Card>

      <ExplainCard
        icon={<Cigarette className='size-4 text-amber-500' />}
        title='멩거가 든 예는 담배였다'
        preview='담배를 아무도 원하지 않게 되면 담배밭과 건조장과 기계가 함께 값을 잃는다.'
        body={
          <>
            <p>
              멩거는 담배를 예로 들었다. 사람들이 담배를 원하지 않게 되는 순간, 담배밭도 건조장도 그 기계를 만드는 전문
              기술도 함께 값을 잃는다. 그 설비에 들어간 노동이 사라진 것도 아니고 기계가 고장 난 것도 아니다. 아래에서
              올라오던 값어치가 끊겼을 뿐이다.
            </p>
            <p className='mt-2'>
              반대 방향은 성립하지 않는다. 밭과 기계에 아무리 많은 노동을 더 부어도 담배를 원하는 사람이 없으면 값은
              돌아오지 않는다. 고차재의 값은 아래에서 올라오는 것이지 위에서 쌓아 내리는 것이 아니다.
            </p>
          </>
        }
      />
    </div>
  );
}

function ChainRow({ label, values }: { label: string; values: string[] }) {
  return (
    <>
      <span>{label}</span>
      {values.map((v, i) => (
        <span key={i} className='text-right tabular-nums'>
          {v}
        </span>
      ))}
    </>
  );
}
