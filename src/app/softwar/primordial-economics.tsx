'use client';

import { useCallback, useMemo, useState } from 'react';

import { Skull, Zap } from 'lucide-react';

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
import { type Organism, buildOrganisms, predationTrajectory } from './models';

const N = 180;
const SEED = 24680;

export function PrimordialEconomics() {
  const [meanPower, setMeanPower] = useState(0.45);
  const [pressure, setPressure] = useState(0.5);
  const [speedMs, setSpeedMs] = useState(600);

  const organisms = useMemo(() => buildOrganisms(N, meanPower, SEED), [meanPower]);

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='자연의 파워 프로젝션: 평화주의는 비싸다'>
        자연에서 자원과 생존을 지키는 방법은 물리력을 투사하는 것이다(원시 경제학). 뿔을 부딪히고 영역을 과시하며
        &#39;공격하면 손해&#39;라는 신호를 보낸다. 포식 압력이 차오를 때, 충분한 물리력을 투사하지 못하는 개체부터
        도태된다. 평화주의(미투사)는 진화적으로 살아남기 어렵다.
      </SectionIntro>

      <Card className='gap-4 p-4'>
        <ControlSlider
          icon={<Zap className='size-4 text-amber-500' />}
          label='평균 투사력 (개체군 평균 와트)'
          hint='개체들이 평균적으로 얼마나 강하게 물리력을 투사하는지. 높일수록 생존자가 많아진다.'
          value={meanPower}
          onChange={setMeanPower}
          min={0.2}
          max={0.8}
          step={0.01}
          format={(v) => `${Math.round(v * 100)}%`}
        />
        <ControlSlider
          icon={<Skull className='size-4 text-rose-500' />}
          label='포식 압력'
          hint='포식자가 가하는 위협의 강도. 이 수준 미만으로 투사하는 개체는 결국 도태된다.'
          value={pressure}
          onChange={setPressure}
          min={0.1}
          max={0.9}
          step={0.01}
          format={(v) => `${Math.round(v * 100)}%`}
        />
      </Card>

      {/* key로 파라미터 변경 시 리마운트 → 라운드 커서가 0으로 돌아간다 */}
      <PredationSim
        key={`${meanPower}|${pressure}`}
        organisms={organisms}
        pressure={pressure}
        speedMs={speedMs}
        onSpeed={setSpeedMs}
      />

      <ExplainCard
        title='물리적 비용 부과는 생존의 필수 조건'
        preview='투사력 없는 개체는 약탈당해 사라진다. 채굴이 태우는 와트도 같은 생존 신호다.'
        body="물리력을 투사하지 못하는 개체는 약탈의 표적이 되어 사라지고, 살아남은 개체군의 평균 투사력은 라운드마다 올라간다. 비트코인 채굴이 소비하는 막대한 전력도 같은 논리다. 낭비처럼 보이는 그 와트가 곧 네트워크가 포식자에게 보내는 '공격하면 손해' 신호이며, 디지털 자산을 지키는 물리적 비용 벽이다."
      />
    </div>
  );
}

function powerColor(o: Organism): string {
  if (o.type === '강한 투사자') return 'bg-emerald-500';
  if (o.type === '약한 방어') return 'bg-amber-500';
  return 'bg-sky-400';
}

function PredationSim({
  organisms,
  pressure,
  speedMs,
  onSpeed,
}: {
  organisms: Organism[];
  pressure: number;
  speedMs: number;
  onSpeed: (ms: number) => void;
}) {
  // 압력이 라운드마다 정해진 폭으로 차오르는 결정론적 모델이라 궤적을 미리 계산해 둔다.
  // 채택 캐스케이드·홀더 딜레마와 같은 구조다.
  const frames = useMemo(() => predationTrajectory(organisms, pressure), [organisms, pressure]);
  const last = frames.length - 1;
  const [round, setRound] = useState(0);

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

  const { state, justChanged } = frames[round];
  const done = round >= last;
  const aliveCount = state.alive.filter(Boolean).length;
  const dead = organisms.length - aliveCount;
  const survivorAvg =
    aliveCount > 0 ? organisms.reduce((s, o, i) => s + (state.alive[i] ? o.power : 0), 0) / aliveCount : 0;

  const states = organisms.map((o, i) => (state.alive[i] ? powerColor(o) : 'bg-muted'));
  const curve = useMemo(() => frames.map((f) => f.state.history[f.state.history.length - 1]), [frames]);

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
      axisLabels={['투사력 낮음 (평화주의)', '투사력 높음 (강한 투사자)']}
      states={states}
      highlight={justChanged}
      reading={
        <>
          칸은 투사력 순으로 왼쪽부터 늘어서 있다. 포식 압력이 차오를 때마다 그보다 약하게 투사하는 개체가 왼쪽 끝에서
          부터 회색으로 꺼진다. 지금 압력{' '}
          <span className='font-medium text-rose-600 dark:text-rose-400'>{Math.round(state.threshold * 100)}%</span>가
          곧 도태 경계의 위치다.
        </>
      }
      legend={
        <>
          <Legend className='bg-emerald-500' label='강한 투사자' />
          <Legend className='bg-amber-500' label='약한 방어' />
          <Legend className='bg-sky-400' label='평화주의자' />
          <Legend className='bg-muted' label='도태됨' />
        </>
      }
      legendNote='테두리 = 이번 라운드에 도태'
      curve={{ values: curve, cursor: round, label: '생존 곡선', className: 'text-emerald-500', min: 0, max: 1 }}
      metrics={
        <>
          <Metric label='생존 개체' value={`${aliveCount} / ${organisms.length}`} tone='good' />
          <Metric label='도태 개체' value={`${dead}`} tone='bad' />
          <Metric label='생존자 평균 투사력' value={`${Math.round(survivorAvg * 100)}%`} tone='accent' />
        </>
      }
      outcome={
        done
          ? aliveCount === 0
            ? { tone: 'bad', text: '💀 포식 압력이 개체군 전체의 투사력을 넘어섰다. 아무도 살아남지 못했다.' }
            : {
                tone: 'accent',
                text: `압력이 멈춘 지점에서 ${aliveCount}개체가 살아남았고, 생존자의 평균 투사력은 시작보다 높아졌다. 도태가 개체군을 더 강하게 투사하는 쪽으로 밀어 올린다.`,
              }
          : undefined
      }
    />
  );
}
