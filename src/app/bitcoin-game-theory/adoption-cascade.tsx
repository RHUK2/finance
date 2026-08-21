'use client';

import { useCallback, useMemo, useState } from 'react';

import { Users } from 'lucide-react';

import { Card } from '@/components/ui/card';

import {
  CascadeStage,
  ControlSlider,
  ExplainCard,
  Legend,
  Metric,
  RoundControls,
  SectionIntro,
} from '@/components/simulation';
import { useRoundEngine } from '@/hooks/use-round-engine';

import { type AgentType, type CascadeAgent, buildCascadeAgents, cascadeTrajectory } from './models';

const N = 180;
const SEED = 12345;

// 유형은 칸 색으로만 구분한다. 격자의 위치는 임계값 순서를 뜻하므로,
// 유형을 공간으로 묶으면 임계값 축이 깨진다.
const TYPE_COLOR: Record<AgentType, { on: string; off: string }> = {
  개인: { on: 'bg-amber-300', off: 'bg-amber-300/15' },
  기업: { on: 'bg-amber-500', off: 'bg-amber-500/15' },
  국가: { on: 'bg-amber-700', off: 'bg-amber-700/20' },
};

export function AdoptionCascade() {
  const [meanThreshold, setMeanThreshold] = useState(0.3);
  const [seedCount, setSeedCount] = useState(6);
  const [speedMs, setSpeedMs] = useState(600);

  const agents = useMemo(() => buildCascadeAgents(N, meanThreshold, SEED), [meanThreshold]);

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='채택 캐스케이드: 도미노처럼 넘어가는 채택'>
        각 행위자는 저마다 &#39;임계값&#39;을 갖는다. 전체 채택률이 그 선을 넘으면 채택에 동참한다(Granovetter 임계값
        모델). 임계값이 낮은 개인이 먼저 움직이고, 채택률이 오르면 기업이, 마지막엔 보수적인 국가까지 합류한다. 한 번
        임계점을 넘으면 멈추기 어려운 연쇄가 시작된다.
      </SectionIntro>

      <Card className='gap-4 p-4'>
        <ControlSlider
          label='따라 사는 기준 (평균 임계값)'
          hint='전체의 몇 %가 사야 나도 따라 사는지. 낮출수록 눈치를 덜 보고 일찍 동참해 더 잘 번진다. 개인·기업·국가의 구성비는 그대로 두고 임계값만 함께 움직인다.'
          value={meanThreshold}
          onChange={setMeanThreshold}
          min={0.1}
          max={0.6}
          step={0.01}
          format={(v) => `${Math.round(v * 100)}%`}
        />
        <ControlSlider
          icon={<Users className='size-4 text-amber-500' />}
          label='처음 사는 사람 수 (시드)'
          hint='아무도 안 사도 맨 먼저 움직이는 불씨. 임계값이 가장 낮은 사람들이며 격자 맨 왼쪽에 있다.'
          value={seedCount}
          onChange={setSeedCount}
          min={1}
          max={30}
          format={(v) => `${v}명`}
        />
      </Card>

      {/* key로 파라미터 변경 시 리마운트 → 궤적 재계산 + 첫 프레임으로 초기화 */}
      <CascadeSim
        key={`${meanThreshold}|${seedCount}`}
        agents={agents}
        seedCount={seedCount}
        speedMs={speedMs}
        onSpeed={setSpeedMs}
      />

      <ExplainCard
        title='왜 채택은 선형이 아니라 폭발적으로 번질까?'
        preview='임계점 전엔 더디다가, 넘는 순간 S자 곡선으로 걷잡을 수 없이 퍼진다.'
        body='채택은 선형으로 늘지 않는다. 초기엔 더디다가 임계점을 넘는 순간 S자 곡선을 그리며 폭발적으로 번진다. 한 국가가 전략적 준비자산으로 비트코인을 채택하면 다른 국가의 채택 임계값을 넘겨 버리고, 그 채택이 또 다음 국가의 임계값을 넘긴다. 먼저 움직일수록 유리하다는 보수 구조가 이 연쇄를 멈추기 어렵게 만든다.'
      />
    </div>
  );
}

function CascadeSim({
  agents,
  seedCount,
  speedMs,
  onSpeed,
}: {
  agents: CascadeAgent[];
  seedCount: number;
  speedMs: number;
  onSpeed: (ms: number) => void;
}) {
  // 모델이 결정론적이라 전 궤적을 한 번에 계산해 둔다. 라운드 왕복과
  // "최종 곡선을 처음부터 보여 주기"가 여기서 나온다.
  const frames = useMemo(() => cascadeTrajectory(agents, seedCount), [agents, seedCount]);
  const last = frames.length - 1;
  const [round, setRound] = useState(0);

  // 다음 프레임으로 한 칸. 남은 프레임이 있는지 동기적으로 반환해 엔진이 종료를 판단한다.
  const step = useCallback(() => {
    if (round >= last) return false;
    setRound(round + 1);
    return round + 1 < last;
  }, [round, last]);

  const engine = useRoundEngine(step, speedMs);
  const seek = useCallback(
    (r: number) => {
      engine.pause();
      setRound(r);
    },
    [engine],
  );

  const frame = frames[round];
  const adoptedCount = frame.adopted.filter(Boolean).length;
  const p = adoptedCount / N;
  const done = round >= last;

  const states = agents.map((a, i) => TYPE_COLOR[a.type][frame.adopted[i] ? 'on' : 'off']);
  const curve = useMemo(() => frames.map((f) => f.p), [frames]);

  return (
    <CascadeStage
      controls={
        <RoundControls
          playing={engine.playing}
          onToggle={engine.toggle}
          onStep={step}
          onReset={() => seek(0)}
          round={round}
          total={last}
          onSeek={seek}
          speedMs={speedMs}
          onSpeed={onSpeed}
          done={done}
        />
      }
      axisLabels={['임계값 낮음 (일찍 채택)', '임계값 높음 (늦게 채택)']}
      states={states}
      highlight={frame.justChanged}
      reading={
        <>
          칸은 임계값 순으로 왼쪽부터 늘어서 있다. 진한 칸이 채택자이고, 그 경계가 곧 전체 채택률{' '}
          <span className='font-medium text-amber-600 dark:text-amber-400'>{Math.round(p * 100)}%</span>다. 채택률이
          오르면 경계 바로 오른쪽 칸들의 임계값을 넘어서고, 그 칸들이 넘어오면 채택률이 또 오른다.
        </>
      }
      legend={
        <>
          <Legend className='bg-amber-300' label='개인' />
          <Legend className='bg-amber-500' label='기업' />
          <Legend className='bg-amber-700' label='국가' />
        </>
      }
      legendNote='테두리 = 이번 라운드에 새로 채택'
      curve={{ values: curve, cursor: round, label: '채택 곡선', className: 'text-amber-500', min: 0, max: 1 }}
      metrics={
        <>
          <Metric label='채택률' value={`${Math.round(p * 100)}%`} tone='accent' />
          <Metric label='채택자' value={`${adoptedCount} / ${N}`} />
          <Metric label='남은 관망자' value={`${N - adoptedCount}`} />
        </>
      }
      outcome={
        done
          ? p > 0.9
            ? { tone: 'accent', text: '🔥 임계점을 넘어 거의 전원이 채택했다. 초기 소수의 움직임이 전체로 번졌다.' }
            : {
                text: '확산이 임계점에 못 미쳐 멈췄다. 채택률이 남은 칸들의 임계값에 닿지 못한 것이다. 시드를 늘리거나 평균 임계값을 낮춰 다시 돌려 보자.',
              }
          : undefined
      }
    />
  );
}
