'use client';

import { useMemo, useState } from 'react';

import { Gauge, Zap } from 'lucide-react';

import {
  CascadeStage,
  ControlSlider,
  ExplainCard,
  Legend,
  Metric,
  RoundControls,
  SectionIntro,
} from '@/components/simulation';
import { Card } from '@/components/ui/card';
import { useTrajectoryPlayer } from '@/hooks/use-round-engine';

import { CASCADE_IMPACT, ENTRY_PRICE, OPENING_SHOCK, type Position, buildPositions, cascadeTrajectory } from './models';

const N = 180;
const SEED = 4242;
const PRICE_FLOOR = 70;

// 증거금 배수 구간별 색. 홀더의 딜레마와 같은 읽는 법이다.
// 위치는 청산 낙폭 순, 색은 배수 구간.
function bandColor(multiple: number, liquidated: boolean): string {
  if (multiple >= 15) return liquidated ? 'bg-rose-700' : 'bg-sky-300';
  if (multiple >= 6) return liquidated ? 'bg-rose-500' : 'bg-sky-500';
  return liquidated ? 'bg-rose-400' : 'bg-sky-700';
}

export function LiquidationCascade() {
  const [meanMultiple, setMeanMultiple] = useState(8);
  const [speedMs, setSpeedMs] = useState(600);

  const positions = useMemo(() => buildPositions(N, meanMultiple, SEED), [meanMultiple]);

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='위험을 받은 쪽이 감당하지 못하면'>
        앞 두 탭에서 헤저가 넘긴 위험은 투기자의 장부에 쌓였다. 투기자는 증거금만 걸고 명목가가 훨씬 큰 포지션을 들고
        있어서, 가격이 일정 폭 이상 빠지면 거래소가 그 포지션을 강제로 닫는다. 그 매도가 가격을 더 끌어내려 다음 층을
        넘긴다. 평균 증거금 배수를 바꿔 가며 연쇄가 어디서 멈추는지 보자. 배수·명목가·낙폭은 구조를 보여주기 위한 예시
        수치다.
      </SectionIntro>

      <Card className='gap-4 p-4'>
        <ControlSlider
          icon={<Gauge className='size-4 text-sky-500' />}
          label='평균 증거금 배수'
          hint='포지션 명목가를 증거금으로 나눈 값. 배수가 클수록 청산 낙폭이 얕아 조금만 떨어져도 털리고, 털릴 때 쏟아지는 명목가도 크다. 빌린 돈이 아니라 증거금만 걸고 가격 변동을 추적하는 구조다.'
          value={meanMultiple}
          onChange={setMeanMultiple}
          min={2}
          max={20}
          step={0.5}
          format={(v) => `${v.toFixed(1)}배`}
        />
      </Card>

      {/* key로 배수 분포 변경 시 리마운트 → 궤적 재계산 + 초기화 */}
      <CascadeSim key={meanMultiple} positions={positions} speedMs={speedMs} onSpeed={setSpeedMs} />

      <ExplainCard
        title='홀더의 딜레마와 모양이 같은데 왜 다른가'
        preview='거기서는 각자가 던질지 말지를 골랐다. 여기서는 아무도 고르지 않는다.'
        body='비트코인 게임이론의 홀더의 딜레마도 이것과 똑같이 생겼다. 개체를 하나의 축으로 정렬하고, 전역 신호 하나가 앞에서부터 경계를 밀고 나가며, 그 전이가 다시 신호를 키운다. 다른 것은 축의 정체다. 확신도는 보유자가 얼마나 견딜지를 스스로 정한 값이라 그 연쇄는 뱅크런처럼 각자의 선택이 모인 결과다. 청산 낙폭은 증거금 배수가 정해 버린 값이고, 거기 도달하면 보유자의 의사와 무관하게 거래소가 포지션을 닫는다. 그래서 이 격자의 칸은 행위자가 아니라 포지션이라 부른다. 같은 모양이 선택에서도 나오고 강제에서도 나온다는 사실이 이 페이지의 논지다. 위험은 넘긴 순간 사라지는 게 아니라 받은 쪽에서 다른 얼굴로 다시 나타난다.'
      />
    </div>
  );
}

function CascadeSim({
  positions,
  speedMs,
  onSpeed,
}: {
  positions: Position[];
  speedMs: number;
  onSpeed: (ms: number) => void;
}) {
  // 난수가 개입하지 않는 결정론적 연쇄라 전 궤적을 미리 계산할 수 있다.
  const frames = useMemo(() => cascadeTrajectory(positions, CASCADE_IMPACT), [positions]);
  const { round, last, frame, done, step, seek, engine } = useTrajectoryPlayer(frames, speedMs);

  const wiped = frame.liquidated.filter(Boolean).length;
  const alive = positions.length - wiped;

  const states = positions.map((p, i) => bandColor(p.multiple, frame.liquidated[i]));
  const curve = useMemo(() => frames.map((f) => f.price), [frames]);

  const collapsed = done && wiped > positions.length * 0.5;
  const survived = done && wiped <= positions.length * 0.1;

  return (
    <CascadeStage
      notice={
        <div className='text-muted-foreground flex items-center gap-1.5 text-xs'>
          <Zap className='size-3.5 text-rose-500' />첫 박자에 외생 충격{' '}
          <span className='font-medium text-rose-600 dark:text-rose-400'>−{Math.round(OPENING_SHOCK * 100)}%</span> 자동
          적용
        </div>
      }
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
      axisLabels={['청산 낙폭 얕음 (고배수)', '청산 낙폭 깊음 (저배수)']}
      states={states}
      highlight={frame.justChanged}
      reading='칸 하나가 포지션 하나다. 청산 낙폭 순으로 왼쪽부터 늘어서 있어 강제청산(붉은색)은 언제나 왼쪽 끝에서 시작해 오른쪽으로 밀고 들어온다. 배수가 큰 포지션일수록 얕은 낙폭에서 털리고 털릴 때 쏟아내는 명목가도 커서, 왼쪽 몇 칸이 넘어가는 것만으로 다음 층이 연달아 넘어간다.'
      legend={
        <>
          <Legend className='bg-sky-500' label='살아 있는 포지션' />
          <Legend className='bg-rose-500' label='강제청산' />
        </>
      }
      legendNote='진할수록 증거금 배수가 낮은 구간'
      curve={{
        values: curve,
        cursor: round,
        label: `가격 ${PRICE_FLOOR}~100`,
        className: frame.price < 80 ? 'text-rose-500' : 'text-sky-500',
        min: PRICE_FLOOR,
        max: ENTRY_PRICE,
      }}
      metrics={
        <>
          <Metric
            label='가격 (진입 100)'
            value={frame.price.toFixed(1)}
            sub={`누적 낙폭 ${Math.round(frame.drawdown * 100)}%`}
            tone={frame.price < 80 ? 'bad' : frame.price >= 85 ? 'good' : undefined}
          />
          <Metric label='강제청산된 포지션' value={`${wiped}`} tone={wiped > 0 ? 'bad' : undefined} />
          <Metric label='살아남은 포지션' value={`${alive}`} tone={alive > positions.length / 2 ? 'good' : undefined} />
        </>
      }
      outcome={
        done
          ? collapsed
            ? {
                tone: 'bad',
                text: '💥 강제청산이 강제청산을 불렀다. 고배수 포지션이 얕은 낙폭에서 먼저 털리며 쏟아낸 명목가가 다음 층의 청산 낙폭까지 가격을 끌어내렸다. 이 구간에서는 선물 시장이 현물 가격을 끌고 다닌다.',
              }
            : survived
              ? {
                  tone: 'good',
                  text: '🧱 첫 충격에서 얼마 털리지 않고 멈췄다. 배수가 낮으면 청산 낙폭이 깊어 웬만한 하락에는 아무도 닿지 않고, 털린 물량도 작아 가격을 더 밀지 못한다.',
                }
              : {
                  text: '⚖️ 앞쪽 고배수 포지션은 털렸지만 연쇄가 벽에 부딪혀 멈췄다. 남은 포지션의 청산 낙폭이 지금 낙폭보다 깊어 더 이상 매도가 나오지 않는다. 배수의 분포가 어디서 두꺼워지는지가 바닥을 정한다.',
                }
          : undefined
      }
    />
  );
}
