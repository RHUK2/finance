'use client';

import { useCallback, useMemo, useState } from 'react';

import { Diamond, Zap } from 'lucide-react';

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
import { useRoundEngine } from '@/hooks/use-round-engine';

import { type Holder, type HolderBand, buildHolders, hodlTrajectory } from './models';

const N = 180;
const SEED = 777;
const SHOCK = 0.15; // 외생 공포 충격 -15%
// 가격 스파크라인의 y축 하한. 0으로 두면 전 구간 최저가가 54여서 곡선이 위쪽에
// 눌려 직선처럼 보인다. 슬라이더 전 구간의 최저가보다 조금 아래로 고정해,
// 설정을 바꿔도 세로 스케일이 변하지 않으면서 하락이 눈에 보이게 한다.
const PRICE_FLOOR = 50;

// 확신도 구간별 색. 채택 캐스케이드와 같은 읽는 법: 위치는 확신도 순, 색은 구간.
const BAND_COLOR: Record<HolderBand, { holding: string; sold: string }> = {
  '약한 손': { holding: 'bg-emerald-300', sold: 'bg-rose-400' },
  '일반 보유자': { holding: 'bg-emerald-500', sold: 'bg-rose-500' },
  다이아몬드손: { holding: 'bg-emerald-700', sold: 'bg-rose-700' },
};

export function HodlDilemma() {
  const [meanConviction, setMeanConviction] = useState(0.5);
  const [speedMs, setSpeedMs] = useState(600);

  const holders = useMemo(() => buildHolders(N, meanConviction, SEED), [meanConviction]);

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='홀더의 딜레마: 던질까, 버틸까'>
        모두가 버티면(HODL) 가격은 지켜지지만, 누군가 던지기 시작하면 하락이 또 다른 매도를 부른다. 각 보유자는 시작가
        대비 누적 낙폭이 자기 확신도를 넘는 순간 던지고, 그 매도가 가격을 더 끌어내려 더 높은 확신도까지 무너뜨린다.
        평균 확신도에 따라 붕괴하는지, 일부만 털리고 멈추는지, 아예 흡수하는지 지켜보자. 여기서 가격은 매도 압력에 따라
        움직일 뿐이다. 이 모델은 폭락이 어떻게 증폭되는지를 설명할 뿐 비트코인의 가치가 얼마인지는 말하지 않는다.
      </SectionIntro>

      <Card className='gap-4 p-4'>
        <ControlSlider
          icon={<Diamond className='size-4 text-emerald-500' />}
          label='얼마나 잘 버티나 (평균 확신도)'
          hint='시작가 대비 몇 %까지 떨어져도 안 던지는지. 확신도 60%면 60% 낙폭까지 버틴다는 뜻이다. 높일수록 다이아몬드손이 많아 충격을 흡수하고, 낮추면 약한 손이 먼저 던져 연쇄 매도가 터진다.'
          value={meanConviction}
          onChange={setMeanConviction}
          min={0.2}
          max={0.9}
          step={0.01}
          format={(v) => `${Math.round(v * 100)}%`}
        />
      </Card>

      {/* key로 확신도 분포 변경 시 리마운트 → 궤적 재계산 + 초기화 */}
      <HodlSim key={meanConviction} holders={holders} speedMs={speedMs} onSpeed={setSpeedMs} />

      <ExplainCard
        title='왜 버티기가 뱅크런과 같은 구조일까?'
        preview='모두 버티면 최선이지만, 각자는 남보다 먼저 던지려는 유혹에 노출된다.'
        body="비트코인 보유자 전체로 보면 '모두 버티기'가 모두에게 최선의 균형이다. 하지만 각자는 '남들이 던지기 전에 내가 먼저 던질까'라는 유혹에 노출돼 있다. 뱅크런과 같은 구조다. 공급량이 고정돼 새로 찍어낼 수 없고, 장기 보유자(다이아몬드손) 비중이 커질수록 유통 물량이 줄어 같은 충격에도 가격이 덜 흔들린다. 확신의 분포가 곧 네트워크의 회복탄력성이다."
      />
    </div>
  );
}

function HodlSim({ holders, speedMs, onSpeed }: { holders: Holder[]; speedMs: number; onSpeed: (ms: number) => void }) {
  // 난수가 개입하지 않는 결정론적 연쇄라 전 궤적을 미리 계산할 수 있다.
  const frames = useMemo(() => hodlTrajectory(holders, SHOCK), [holders]);
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
  const soldCount = state.sold.filter(Boolean).length;
  const holding = N - soldCount;

  const states = holders.map((h, i) => BAND_COLOR[h.band][state.sold[i] ? 'sold' : 'holding']);
  const curve = useMemo(() => frames.map((f) => f.state.price), [frames]);

  const collapsed = done && soldCount > N * 0.5;
  const survived = done && soldCount <= N * 0.1;
  const partial = done && !collapsed && !survived;

  return (
    <CascadeStage
      notice={
        <div className='text-muted-foreground flex items-center gap-1.5 text-xs'>
          <Zap className='size-3.5 text-rose-500' />첫 박자에 외생 공포 충격{' '}
          <span className='font-medium text-rose-600 dark:text-rose-400'>−{Math.round(SHOCK * 100)}%</span> 자동 적용
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
      axisLabels={['확신도 낮음 (약한 손)', '확신도 높음 (다이아몬드손)']}
      states={states}
      highlight={justChanged}
      reading='칸은 확신도 순으로 왼쪽부터 늘어서 있다. 매도(붉은색)는 언제나 왼쪽 끝에서 시작해 오른쪽으로 밀고 들어온다. 누적 낙폭이 깊어질수록 더 높은 확신도까지 무너지기 때문이다. 가운데는 보유자가 촘촘해 한 번 뚫리면 빠르게 번지고, 오른쪽 끝은 성겨서 연쇄가 거기서 힘을 잃는다.'
      legend={
        <>
          <Legend className='bg-emerald-500' label='버티는 손' />
          <Legend className='bg-rose-500' label='매도' />
        </>
      }
      legendNote='진할수록 확신도가 높은 구간'
      curve={{
        values: curve,
        cursor: round,
        label: `가격 ${PRICE_FLOOR}~100`,
        className: state.price < 60 ? 'text-rose-500' : 'text-emerald-500',
        min: PRICE_FLOOR,
        max: 100,
      }}
      metrics={
        <>
          <Metric
            label='가격 (시작 100)'
            value={state.price.toFixed(1)}
            sub={`누적 낙폭 ${Math.round(state.drawdown * 100)}%`}
            tone={state.price < 60 ? 'bad' : state.price >= 95 ? 'good' : undefined}
          />
          <Metric label='매도자' value={`${soldCount}`} tone='bad' />
          <Metric label='버티는 손' value={`${holding}`} tone='good' />
        </>
      }
      outcome={
        done
          ? collapsed
            ? {
                tone: 'bad',
                text: '💥 데스 스파이럴: 매도가 매도를 부르며 가격이 붕괴했다. 약한 손의 비중이 높을수록 작은 충격도 연쇄 매도로 번진다.',
              }
            : partial
              ? {
                  text: '🧱 약한 손은 털렸지만 연쇄가 벽에 부딪혀 멈췄다. 남은 보유자의 확신도가 지금 낙폭보다 높아 더 이상 매도가 나오지 않는다. 확신의 분포가 어디서 두꺼워지는지가 바닥을 정한다.',
                }
              : {
                  tone: 'good',
                  text: '💎 다이아몬드손이 충격을 흡수했다. 확신이 강한 보유자가 던지지 않으니 매도가 더 번지지 않고 첫 충격 선에서 멈췄다.',
                }
          : undefined
      }
    />
  );
}
