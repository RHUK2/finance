'use client';

import { useMemo, useState } from 'react';
import { Radio } from 'lucide-react';

import { Card } from '@/components/ui/card';
import {
  ExplainCard,
  IllustrativeDisclaimer,
  Legend,
  Metric,
  RoundControls,
  SectionIntro,
} from '@/components/simulation';
import { useRoundEngine } from '@/hooks/use-round-engine';
import { cn } from '@/lib/utils';
import { generateGossipGraph, graphHopDistances, maxHops } from '@/lib/p2p-concept';

const NODE_COUNT = 40;
const AVG_DEGREE = 5;
const SEED = 20260720;
const ORIGIN = 0;

export function GossipSim() {
  const graph = useMemo(() => generateGossipGraph(NODE_COUNT, AVG_DEGREE, SEED), []);
  const dist = useMemo(() => graphHopDistances(graph.adjacency, ORIGIN), [graph]);
  const maxRound = maxHops(dist);

  const [round, setRound] = useState(0);
  const [speedMs, setSpeedMs] = useState(600);

  function step(): boolean {
    if (round >= maxRound) return false;
    setRound((r) => r + 1);
    return round + 1 < maxRound;
  }

  const engine = useRoundEngine(step, speedMs);

  const informed = dist.filter((d) => d <= round).length;
  const pct = (informed / NODE_COUNT) * 100;
  const done = round >= maxRound;

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='가십 프로토콜: 이웃이 이웃에게, 순식간에 전 세계로'>
        서명까지 마친 트랜잭션을 방송하면, 노드는 그걸 중앙 서버에 올리는 게 아니라{' '}
        <b>연결된 피어들에게 inv(있다는 알림) → getdata(달라는 요청) → tx(실제 전송)</b> 순으로 넘긴다. 받은 노드는
        검증한 뒤 자기 피어들에게 다시 넘긴다. 이 과정이 반복되며 순식간에 네트워크 전체로 퍼진다. 재생을 눌러 한
        노드에서 시작한 소문이 몇 홉 만에 전체에 닿는지 보자.
      </SectionIntro>

      <IllustrativeDisclaimer>
        실제 비트코인 노드는 <b>8~125개의 피어와 무작위로 연결</b>되며, 전체 네트워크는 수만 개 노드 규모다. 여기서는
        화면에 다 그릴 수 있도록 노드 {NODE_COUNT}개·평균 연결 {AVG_DEGREE}개로 훨씬 작게 줄였지만, 각 노드가 소수의
        무작위 피어와만 연결된 그래프라는 구조 자체는 실제와 같다. 그 덕에 격자보다 훨씬 적은 홉 수로 전체에 퍼지는 걸
        볼 수 있다.
      </IllustrativeDisclaimer>

      <Card className='flex flex-col gap-3 p-4'>
        <RoundControls
          playing={engine.playing}
          onToggle={engine.toggle}
          onStep={step}
          onReset={() => {
            engine.pause();
            setRound(0);
          }}
          round={round}
          speedMs={speedMs}
          onSpeed={setSpeedMs}
          done={done}
          unit='홉'
        />

        <svg viewBox='0 0 100 100' className='mx-auto aspect-square w-full max-w-sm'>
          {graph.edges.map(([a, b], i) => {
            const reached = Math.max(dist[a], dist[b]) <= round;
            return (
              <line
                key={i}
                x1={graph.positions[a].x}
                y1={graph.positions[a].y}
                x2={graph.positions[b].x}
                y2={graph.positions[b].y}
                strokeWidth={0.3}
                className={cn(
                  'transition-colors duration-300',
                  reached ? 'stroke-emerald-500/40' : 'stroke-muted-foreground/15',
                )}
              />
            );
          })}
          {graph.positions.map((p, i) => {
            const isOrigin = i === ORIGIN;
            const reached = dist[i] <= round;
            return (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={isOrigin ? 2.6 : 2}
                className={cn(
                  'stroke-background transition-colors duration-300',
                  isOrigin ? 'fill-amber-500' : reached ? 'fill-emerald-500' : 'fill-muted-foreground',
                )}
                strokeWidth={0.5}
              />
            );
          })}
        </svg>

        <div className='flex flex-wrap gap-4 text-xs'>
          <Legend className='bg-amber-500' label='발신 노드' />
          <Legend className='bg-emerald-500' label='tx를 받은 노드' />
          <Legend className='bg-muted-foreground' label='아직 못 받은 노드' />
        </div>

        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
          <Metric label='받은 노드' value={`${informed} / ${NODE_COUNT}`} tone='accent' />
          <Metric label='도달률' value={`${pct.toFixed(0)}%`} tone={done ? 'good' : undefined} />
          <Metric label='최대 홉 수' value={`${maxRound}홉`} />
        </div>
      </Card>

      <ExplainCard
        icon={<Radio className='size-4 text-sky-600 dark:text-sky-400' />}
        title='왜 노드마다 다시 검증하고서야 넘길까'
        preview='아무나 던진 가짜 tx가 그대로 퍼지지 않도록, 받는 노드마다 서명·수수료를 확인한 뒤에만 다음으로 넘긴다.'
        body={
          <>
            받은 노드는 <b>서명과 스크립트가 유효한지, 이미 쓰인 동전(UTXO)을 다시 쓰려는 이중지불은 아닌지</b>를 먼저
            확인한다. 이 검증을 통과해야만 자기 멤풀에 넣고 이웃에게 다시 넘긴다. 그래서 가십은 단순한 소문 전파가
            아니라, 매 홉마다 검증을 통과해야 이어지는 &#39;검증된 전파&#39;다.
          </>
        }
      />
    </div>
  );
}
