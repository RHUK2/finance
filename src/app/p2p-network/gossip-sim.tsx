'use client';

import { useMemo, useState } from 'react';
import { Radio } from 'lucide-react';

import { Panel } from '@/components/panel';
import { ExplainCard, Legend, Metric, RoundControls, SectionIntro } from '@/components/simulation';
import { useTrajectory } from '@/hooks/use-round-engine';
import { cn, formatPct } from '@/lib/utils';
import { generateGossipGraph, graphHopDistances, maxHops } from '@/lib/p2p-concept';

const NODE_COUNT = 40;
const AVG_DEGREE = 5;
const SEED = 20260720;
const ORIGIN = 0;

export function GossipSim() {
  const graph = useMemo(() => generateGossipGraph(NODE_COUNT, AVG_DEGREE, SEED), []);
  const dist = useMemo(() => graphHopDistances(graph.adjacency, ORIGIN), [graph]);
  const maxRound = maxHops(dist);

  const [speedMs, setSpeedMs] = useState(600);
  const { round, done, step, seek, engine } = useTrajectory(maxRound, speedMs);

  const informed = dist.filter((d) => d <= round).length;
  const pct = (informed / NODE_COUNT) * 100;

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='가십 프로토콜: 이웃이 이웃에게, 순식간에 전 세계로'>
        서명까지 마친 트랜잭션을 방송하면, 노드는 그걸 중앙 서버에 올리는 게 아니라{' '}
        <b>연결된 피어들에게 inv(있다는 알림) → getdata(달라는 요청) → tx(실제 전송)</b> 순으로 넘긴다. 받은 노드는
        검증한 뒤 자기 피어들에게 다시 넘긴다. 이 과정이 반복되며 순식간에 네트워크 전체로 퍼진다. 재생을 눌러 한
        노드에서 시작한 소문이 몇 홉 만에 전체에 닿는지 보자. 실제 노드는 8~125개의 피어(Bitcoin Core 31 기준)와
        무작위로 연결되고 네트워크는 수만 개 노드 규모인데, 여기서는 노드 {NODE_COUNT}개·평균 연결 {AVG_DEGREE}개로
        줄이고 전파를 홉 단위로 끊어 보여 준다(실제로는 대역폭과 지연에 따라 연속으로 일어난다). 소수의 무작위 피어와만
        연결된 그래프라는 구조는 실제와 같다.
      </SectionIntro>

      <Panel className='gap-3'>
        <RoundControls
          playing={engine.playing}
          onToggle={engine.toggle}
          onStep={step}
          onReset={() => {
            seek(0);
          }}
          round={round}
          speedMs={speedMs}
          onSpeed={setSpeedMs}
          done={done}
          unit='홉'
        />

        <svg
          viewBox='0 0 100 100'
          className='mx-auto aspect-square w-full max-w-sm'
          role='img'
          aria-label={`노드 ${NODE_COUNT}개 중 ${informed}개가 tx를 받았다 (${round}홉)`}
        >
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
                  reached ? 'stroke-series-1/40' : 'stroke-muted-foreground/15',
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
                  isOrigin ? 'fill-series-2' : reached ? 'fill-series-1' : 'fill-muted-foreground',
                )}
                strokeWidth={0.5}
              />
            );
          })}
        </svg>

        <div className='flex flex-wrap gap-4 text-xs'>
          <Legend className='bg-series-2' label='발신 노드' />
          <Legend className='bg-series-1' label='tx를 받은 노드' />
          <Legend className='bg-muted-foreground' label='아직 못 받은 노드' />
        </div>

        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
          <Metric label='받은 노드' value={`${informed} / ${NODE_COUNT}`} tone='accent' />
          <Metric label='도달률' value={formatPct(pct, 0)} tone={done ? 'good' : undefined} />
          <Metric label='최대 홉 수' value={`${maxRound}홉`} />
        </div>
      </Panel>

      <ExplainCard
        icon={<Radio className='size-4 text-series-1' />}
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
