'use client';

import { useMemo, useState } from 'react';
import { Shuffle } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { ControlSlider, ExplainCard, IllustrativeDisclaimer, Metric, SectionIntro } from '@/components/simulation';
import { anonymityChance } from '@/lib/privacy-concept';
import { mulberry32 } from '@/lib/utils';

export function CoinJoin() {
  const [participants, setParticipants] = useState(5);

  const permutation = useMemo(() => {
    const rng = mulberry32(participants * 97 + 13);
    const indices = Array.from({ length: participants }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  }, [participants]);

  const chance = anonymityChance(participants);

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='CoinJoin: 여러 명이 한 트랜잭션에 숨는다'>
        앞 탭의 &#39;공통 입력 소유권&#39; 휴리스틱은 한 트랜잭션의 입력이 전부 같은 지갑 것이라고 가정한다. CoinJoin은
        이 가정 자체를 깨버린다. 서로 모르는 여러 참가자가{' '}
        <b>각자의 입력을 한 트랜잭션에 모으고, 똑같은 금액의 출력을 각자 하나씩</b> 받는다. 입력과 출력이 모두 뒤섞여,
        어느 입력이 어느 출력으로 갔는지 외부에서는 알 수 없다.
      </SectionIntro>

      <Card className='flex flex-col gap-4 p-4'>
        <ControlSlider
          icon={<Shuffle className='size-4 text-amber-600 dark:text-amber-400' />}
          label='CoinJoin 참가자 수'
          value={participants}
          onChange={setParticipants}
          min={2}
          max={10}
          step={1}
          format={(v) => `${v}명`}
        />

        <div className='flex items-stretch justify-between gap-4'>
          <div className='flex flex-1 flex-col gap-1.5'>
            <span className='text-muted-foreground text-center text-xs'>입력</span>
            {Array.from({ length: participants }).map((_, i) => (
              <div key={i} className='bg-muted flex h-8 items-center justify-center rounded-md text-xs font-medium'>
                참가자 {i + 1}
              </div>
            ))}
          </div>

          <svg viewBox={`0 0 100 ${participants * 40}`} className='w-24 shrink-0' preserveAspectRatio='none'>
            {permutation.map((to, from) => {
              const y1 = 20 + from * 40;
              const y2 = 20 + to * 40;
              return (
                <line
                  key={from}
                  x1={0}
                  y1={y1}
                  x2={100}
                  y2={y2}
                  className='stroke-amber-500/50'
                  strokeWidth={1.5}
                  vectorEffect='non-scaling-stroke'
                />
              );
            })}
          </svg>

          <div className='flex flex-1 flex-col gap-1.5'>
            <span className='text-muted-foreground text-center text-xs'>동일 금액 출력</span>
            {Array.from({ length: participants }).map((_, i) => (
              <div key={i} className='bg-muted flex h-8 items-center justify-center rounded-md font-mono text-xs'>
                0.01 BTC
              </div>
            ))}
          </div>
        </div>

        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
          <Metric label='익명 집합 크기' value={`${participants}명`} tone='accent' />
          <Metric label='특정 출력 주인 추측 확률' value={`${(chance * 100).toFixed(0)}%`} tone='good' />
          <Metric label='가능한 대응 조합 수' value={`${factorial(participants).toLocaleString('ko-KR')}가지`} />
        </div>
      </Card>

      <IllustrativeDisclaimer>
        실제 CoinJoin(JoinMarket, Wasabi, Whirlpool 등)은 참가자 조율, 라운드 실패 시 재시도, 출력 금액을 표준화하는
        방식 등 훨씬 복잡한 프로토콜을 쓴다. 여기서는 &#39;똑같은 출력을 여러 개 만들면 대응 관계가 조합적으로
        모호해진다&#39;는 핵심 원리만 보여준다.
      </IllustrativeDisclaimer>

      <ExplainCard
        title='CoinJoin이 모든 걸 지워주진 않는다'
        preview='금액을 표준화하지 않거나, CoinJoin 이후 출력을 곧바로 다른 주소와 합치면 추적 실마리가 다시 생긴다.'
        body={
          <>
            CoinJoin의 프라이버시는 출력 금액이 <b>완전히 똑같을 때만</b> 성립한다. 출력마다 금액이 다르면 &#39;누가 몇
            개를 받았는지&#39;로 다시 좁혀볼 수 있다. 또한 CoinJoin으로 받은 출력을, 이미 자신과 연결된 걸로 알려진
            주소와 나중에 같은 트랜잭션에서 함께 쓰면, 그 순간 다시 &#39;공통 입력 소유권&#39; 휴리스틱에 걸려 연결이
            되살아난다. 프라이버시는 한 번의 기술로 완성되는 게 아니라, 재사용 없는 주소 습관과 CoinJoin 같은 기법을
            함께 유지해야 지켜진다.
          </>
        }
      />
    </div>
  );
}

function factorial(n: number): number {
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}
