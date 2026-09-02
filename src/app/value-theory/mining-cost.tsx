'use client';

import Link from 'next/link';

import { ArrowDown, ArrowDownToLine, Gauge, Radar, TrendingUp, Zap } from 'lucide-react';

import { ExplainCard, SectionIntro, StatusBanner } from '@/components/simulation';
import { Card } from '@/components/ui/card';

const CHAIN = [
  { label: '가격이 오른다', sub: '평가하는 쪽에서 값이 정해진다' },
  { label: '채굴 수익성이 오른다', sub: '같은 해시로 버는 돈이 늘어난다' },
  { label: '해시레이트가 오른다', sub: '장비가 더 들어온다' },
  { label: '난이도가 오른다', sub: '2016블록마다 자동으로 조정된다' },
  { label: '코인당 채굴비용이 오른다', sub: '같은 보상을 더 많은 전기로 나눠 갖는다' },
];

export function MiningCost() {
  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='채굴비용은 가격의 바닥이 아니다'>
        비트코인 가격이 채굴 원가 근처에서 지지받는다는 말을 흔히 듣는다. 원가가 값을 떠받친다는 이 서술은 노동가치설의
        인과를 그대로 옮긴 것이다. 그런데 비트코인에는 그 인과를 직접 검증할 수 있는 장치가 있다. 난이도 조정이다.
        발행량이 프로토콜로 못 박혀 있고 난이도가 해시레이트를 따라가므로, 어느 쪽이 어느 쪽을 미는지가 다른 어떤
        재화보다 선명하게 드러난다.
      </SectionIntro>

      <Card className='flex flex-col gap-3 p-4'>
        <span className='flex items-center gap-1.5 text-sm font-semibold'>
          <ArrowDownToLine className='size-4 text-amber-500' />
          인과는 이 방향으로만 흐른다
        </span>
        <div className='flex flex-col gap-1'>
          {CHAIN.map((s, i) => (
            <div key={s.label} className='flex flex-col gap-1'>
              <div className='flex flex-col rounded-md border px-3 py-2'>
                <span className='text-sm font-medium'>{s.label}</span>
                <span className='text-muted-foreground text-xs/snug'>{s.sub}</span>
              </div>
              {i < CHAIN.length - 1 && <ArrowDown className='text-muted-foreground mx-auto size-3' />}
            </div>
          ))}
        </div>
        <p className='text-muted-foreground text-xs/relaxed'>
          사슬은 여기서 끝난다. 코인당 채굴비용이 올랐다고 해서 가격이 다시 오르지는 않는다. 이 사슬이 고리가 아니라는
          것이 이 탭의 요점이다.
        </p>
        <p className='text-muted-foreground text-xs/relaxed'>
          난이도 조정이 어떻게 도는지는{' '}
          <Link href='/block-mining' className='underline underline-offset-2'>
            블록·채굴·합의
          </Link>{' '}
          페이지에 있다. 여기서 볼 것은 메커니즘이 아니라 방향이다.
        </p>
      </Card>

      <StatusBanner icon={<TrendingUp className='size-4' />} tone='accent'>
        가격이 비용을 만든다. 반대로 뒤집으면 사슬이 끊긴다.
      </StatusBanner>

      <Card className='flex flex-col gap-2 p-4'>
        <span className='flex items-center gap-1.5 text-sm font-semibold'>
          <Zap className='size-4 text-rose-500' />
          반대로 뒤집으면 어디서 끊기나
        </span>
        <p className='text-muted-foreground text-sm/relaxed'>
          전기요금이 올라 채굴비용이 뛰었다고 하자. 코인 발행량은 프로토콜이 정해 둔 그대로다. 비싸게 만들었으니 비싸게
          팔겠다고 해도 사 줄 사람이 늘지 않는다. 남는 길은 하나다. 요금을 감당하지 못하는 채굴자부터 기계를 끄고,
          해시레이트가 빠지고, 난이도가 내려가 남은 채굴자의 코인당 비용이 다시 가격에 맞춰진다. 비용이 가격을 끌어올린
          것이 아니라 가격이 비용을 잘라 낸 것이다.
        </p>
      </Card>

      <Card className='flex flex-col gap-2 p-4'>
        <span className='flex items-center gap-1.5 text-sm font-semibold'>
          <Gauge className='size-4 text-sky-500' />
          2022년에 실제로 그렇게 됐다
        </span>
        <p className='text-muted-foreground text-sm/relaxed'>
          2022년 하락장에서 비트코인 가격은 여러 기관이 추정하던 채굴 원가 아래로 내려갔다. 원가가 바닥이라면 가격이
          거기서 멈추거나 되돌아왔어야 한다. 벌어진 일은 반대였다. 가격은 원가를 아랑곳하지 않고 더 내려갔고, 전기요금이
          비싼 채굴자부터 기계를 껐으며, 대형 채굴 업체 여럿이 파산 절차에 들어갔다. 해시레이트가 빠지자 난이도가 하향
          조정됐고 코인당 채굴비용도 따라 내려갔다. 바닥 역할을 한 것은 원가가 아니라, 원가를 가격에 맞춰 깎아 내리는
          난이도 조정이었다.
        </p>
        <p className='text-muted-foreground text-xs/relaxed'>
          채굴 원가 추정치는 산정 기관마다 크게 갈려 여기에 특정 숫자를 적지 않았다. 논지에 필요한 것은 금액이 아니라
          어느 쪽이 어느 쪽을 따라갔느냐다.
        </p>
      </Card>

      <ExplainCard
        icon={<Radar className='size-4 text-violet-500' />}
        title='그럼 소프트워는 틀린 이야기인가'
        preview='작업증명이 만드는 것은 값어치가 아니라 탈취 비용이라는 속성이다.'
        body={
          <>
            <p>
              이 사이트의{' '}
              <Link href='/softwar' className='underline underline-offset-2'>
                비트코인 소프트워
              </Link>{' '}
              페이지는 작업증명이 소비하는 전기가 자산을 지킨다는 제이슨 로워리의 주장을 다룬다. 에너지가 값을 만든다는
              말로 읽으면 이 탭과 정면으로 부딪히는 것처럼 보인다.
            </p>
            <p className='mt-2'>
              부딪히지 않는다. 전기가 만들어 내는 것은 값어치가 아니라 속성 하나다. 자산을 빼앗는 비용이 자산 가치를
              따라 오른다는 성질이다. 그 성질이 얼마짜리인지는 여전히 평가하는 쪽이 정한다. 아무도 지킬 값어치가 있다고
              보지 않는 자산이라면 아무리 많은 와트를 부어도 값이 붙지 않는다. 에너지는 값어치의 원천이 아니라 값어치가
              매겨질 만한 속성을 만드는 수단이다.
            </p>
            <p className='mt-2'>
              방향으로 정리하면 이렇다. 평가가 값을 만들고, 값이 해시레이트를 부르고, 해시레이트가 탈취 비용을 올려 그
              평가를 지탱한다. 위의 사슬과 달리 여기서는 끝이 처음으로 돌아온다. 다만 되돌아오는 것은 채굴에 들어간
              비용이 아니라 그 비용이 만들어 낸 방어 가능성이고, 그것을 값으로 환산하는 일은 여전히 평가하는 쪽이 한다.
              출발점은 바뀌지 않는다.
            </p>
          </>
        }
      />
    </div>
  );
}
