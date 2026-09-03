'use client';

import { useMemo, useState } from 'react';

import { Activity, TrendingUp } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { ControlSlider, ExplainCard, Metric, RoundControls, SectionIntro, Sparkline } from '@/components/simulation';
import { useTrajectoryPlayer } from '@/hooks/use-round-engine';
import { formatUsd, mulberry32 } from '@/lib/utils';

import { GOLD_CAP, SUPPLY, realizedVol, stepP } from './models';

const SEED = 12345;
const MAX_STEPS = 240;
const VOL_WINDOW = 20;
const WIN_PRICE = GOLD_CAP / SUPPLY; // 성공했을 때 가정 가격 (목표 시장 ÷ 공급량)
const START_P = 0.05;
// 스텝 수가 많아 게임이론 기본값보다 빠른 속도 프리셋을 쓴다.
const SPEEDS = [
  { label: '0.5×', ms: 560 },
  { label: '1×', ms: 280 },
  { label: '2×', ms: 120 },
];

export function VolatilityEngine() {
  const [sigma, setSigma] = useState(0.02);
  const [drift, setDrift] = useState(0.002);
  const [speedMs, setSpeedMs] = useState(280);

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='변동성의 정체: 확률을 실시간으로 매기는 시장'>
        시장은 매일 뉴스에 따라 성공 확률을 조금씩 고쳐 쓴다. 그런데 성공 확률이 낮을 때는 똑같은 크기의 뉴스라도 가격이
        몇 배씩 출렁이고, 확률이 높아질수록 같은 뉴스에도 덜 흔들린다. 재생을 눌러 보자. 뉴스의 크기(σ)는 그대로 둬도,
        성공 확률이 올라갈수록 변동성이 저절로 줄어드는 걸 볼 수 있다. 수치는 개념 이해용 예시다.
      </SectionIntro>

      <Card className='gap-4 p-4'>
        <ControlSlider
          icon={<Activity className='size-4 text-amber-500' />}
          label='하루치 뉴스 충격 (σ)'
          hint='하루치 뉴스가 성공 확률을 흔드는 크기. 이 값을 고정해 둬도 변동성은 성공 확률에 따라 달라진다.'
          value={sigma}
          onChange={setSigma}
          min={0.005}
          max={0.05}
          step={0.005}
          format={(v) => v.toFixed(3)}
        />
        <ControlSlider
          icon={<TrendingUp className='size-4 text-amber-500' />}
          label='확률 추세 (drift)'
          hint='뉴스와 무관하게 성공 확률이 평균적으로 표류하는 속도. 음수로 두면 실패 쪽으로 향한다.'
          value={drift}
          onChange={setDrift}
          min={-0.004}
          max={0.01}
          step={0.001}
          format={(v) => (v >= 0 ? `+${v.toFixed(3)}` : v.toFixed(3))}
        />
      </Card>

      <VolSim key={`${sigma}|${drift}`} sigma={sigma} drift={drift} speedMs={speedMs} onSpeed={setSpeedMs} />

      <ExplainCard
        title='변동성은 결함이 아니라 정보다'
        preview='큰 변동성은 시장이 아직 성패의 답을 정하지 못했다는 신호다.'
        body='비트코인의 큰 변동성은 시장이 아직 답을 정하지 못했다는 신호다. 성공할지 실패할지 매일 확률을 다시 매기다 보니 가격이 크게 흔들리는 것이다. 변동성이 크다는 건 그만큼 이 승부가 아직 미결이라는 뜻이고, 성공이든 실패든 결론이 분명해질수록(채택이 무르익을수록) 변동성은 저절로 잦아든다. 다음 탭의 실제 데이터가 이 하락 추세를 보여준다.'
      />
    </div>
  );
}

function VolSim({
  sigma,
  drift,
  speedMs,
  onSpeed,
}: {
  sigma: number;
  drift: number;
  speedMs: number;
  onSpeed: (ms: number) => void;
}) {
  // 고정 시드 난수라 파라미터가 정해지면 경로 전체가 결정된다. 캐스케이드 시뮬레이션들과
  // 마찬가지로 궤적을 미리 계산해 두고 useTrajectoryPlayer로 재생한다. 덕분에 라운드를
  // 앞뒤로 왕복하고 곡선의 최종 모양을 첫 프레임부터 보여 줄 수 있다. 격자가 없어
  // CascadeStage는 쓰지 않지만, 재생 배선은 캐스케이드 넷과 같은 것을 쓴다.
  const ps = useMemo(() => {
    const rng = mulberry32(SEED);
    const path = [START_P];
    for (let i = 0; i < MAX_STEPS; i++) path.push(stepP(path[path.length - 1], sigma, drift, rng));
    return path;
  }, [sigma, drift]);

  const { round, last, frame: p, done, step, seek, engine } = useTrajectoryPlayer(ps, speedMs);

  // 가격 = p × 성공가, 수익률 = log(pₜ/pₜ₋₁) (성공가는 상수라 약분된다).
  const prices = useMemo(() => ps.map((v) => v * WIN_PRICE), [ps]);
  const returns = ps.slice(1, round + 1).map((v, i) => Math.log(v / ps[i]));
  const vol = realizedVol(returns, VOL_WINDOW) * 100;

  return (
    <>
      <Card className='gap-3 p-4'>
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
          unit='스텝'
          speeds={SPEEDS}
        />
        <Sparkline values={prices} cursor={round} label='가격' className='text-amber-500' heightClass='h-12' />
        <Sparkline
          values={ps}
          cursor={round}
          label='성공 확률 p'
          className='text-sky-500'
          min={0}
          max={1}
          heightClass='h-12'
        />
      </Card>

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
        <Metric label='성공 확률 p' value={`${Math.round(p * 100)}%`} tone='accent' />
        <Metric label='현재 가격' value={formatUsd(p * WIN_PRICE)} />
        <Metric
          label={`최근 변동성 (${VOL_WINDOW}스텝)`}
          value={round < 2 ? '—' : `${vol.toFixed(1)}%`}
          tone={round < 2 ? undefined : vol > 8 ? 'bad' : 'good'}
          sub={round < 2 ? '스텝이 쌓여야 계산된다' : undefined}
        />
      </div>
    </>
  );
}
