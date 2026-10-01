'use client';

import { useState } from 'react';
import { GitFork, ShieldOff } from 'lucide-react';

import { Panel } from '@/components/panel';
import { ControlSlider, ExplainCard, Metric, RoundControls, SectionIntro, StatusBanner } from '@/components/simulation';
import { useRoundEngine } from '@/hooks/use-round-engine';
import { cn, mulberry32 } from '@/lib/utils';

// 이 라운드까지 못 따라잡으면 멈춘다. 과반 미만이면 이 시점을 사실상 안전으로 읽지만,
// 과반이면 시간이 걸릴 뿐 결국 따라잡으므로(chain-concept의 q ≥ p 분기) 안전 판정을 내지 않는다.
const MAX_ROUNDS = 60;

export function ReorgRace() {
  const [attackPct, setAttackPct] = useState(20);
  const [confirmations, setConfirmations] = useState(3);

  const [seed, setSeed] = useState(1);
  const [round, setRound] = useState(0);
  const [honestExtra, setHonestExtra] = useState(0);
  const [attackerBlocks, setAttackerBlocks] = useState(0);
  const [speedMs, setSpeedMs] = useState(400);

  const q = attackPct / 100;
  const majority = q >= 0.5;
  const honestTotal = confirmations + honestExtra;
  const caughtUp = attackerBlocks >= honestTotal;
  const safe = round >= MAX_ROUNDS && !caughtUp;
  const finished = caughtUp || safe;

  function step(): boolean {
    if (finished) return false;
    const rng = mulberry32(seed * 1_000_003 + round);
    const attackerWinsRound = rng() < q;

    const nextAttacker = attackerBlocks + (attackerWinsRound ? 1 : 0);
    const nextHonest = honestTotal + (attackerWinsRound ? 0 : 1);
    const nextRound = round + 1;

    setAttackerBlocks(nextAttacker);
    setHonestExtra(nextHonest - confirmations);
    setRound(nextRound);

    return nextAttacker < nextHonest && nextRound < MAX_ROUNDS;
  }

  const engine = useRoundEngine(step, speedMs);

  function reset() {
    engine.pause();
    setSeed((s) => s + 1);
    setRound(0);
    setHonestExtra(0);
    setAttackerBlocks(0);
  }

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='재구성은 왜 일어날까: 몰래 채굴하는 또 다른 체인'>
        가맹점이 트랜잭션을 <b>{confirmations}개 확인</b> 보고 상품을 내줬다고 하자. 그 순간 공격자는 그 트랜잭션이{' '}
        <b>없는</b> 비밀 체인을 그 이전 블록부터 몰래 채굴하기 시작한다. 공격자의 체인이 정직한 체인을 앞서는 순간,
        네트워크는 작업량이 더 많은 체인을 채택하고 정직한 체인의 블록들은 통째로 고아가 된다. 그 안의 트랜잭션도 함께
        무효가 된다. 재생을 눌러 두 체인이 경주하는 걸 보자. 여기서는 매 라운드 다음 블록을 누가 찾는지를 공격자
        해시레이트 비중으로 동전 던지듯 정한다. 실제로는 각 채굴자가 독립적인 포아송 과정을 따르지만, 다음 블록을 누가
        찾을 확률은 같다. 이 경주는 백서의 계산처럼 공격자 체인이 같은 길이로 따라잡은 시점을 재구성으로 센다.
      </SectionIntro>

      <Panel>
        <ControlSlider
          icon={<GitFork className='size-4 text-series-1' />}
          label='공격자 해시레이트 비중'
          value={attackPct}
          onChange={(v) => {
            setAttackPct(v);
            reset();
          }}
          min={1}
          max={60}
          step={1}
          format={(v) => `${v}%`}
        />
        <ControlSlider
          icon={<ShieldOff className='size-4 text-series-2' />}
          label='가맹점이 기다린 확인 수'
          hint='공격자는 이 수만큼 뒤처진 상태에서 비밀 체인을 시작한다.'
          value={confirmations}
          onChange={(v) => {
            setConfirmations(v);
            reset();
          }}
          min={1}
          max={10}
          step={1}
          format={(v) => `확인 ${v}개`}
        />
      </Panel>

      <Panel className='gap-3'>
        <RoundControls
          playing={engine.playing}
          onToggle={engine.toggle}
          onStep={step}
          onReset={reset}
          round={round}
          speedMs={speedMs}
          onSpeed={setSpeedMs}
          done={finished}
          unit='라운드'
        />

        <ChainRow
          label='정직한 체인 (공개)'
          confirmed={confirmations}
          extra={honestExtra}
          tone='good'
          faded={caughtUp}
        />
        <ChainRow label='공격자의 비밀 체인' confirmed={0} extra={attackerBlocks} tone={caughtUp ? 'bad' : 'accent'} />

        <StatusBanner tone={caughtUp ? 'bad' : safe ? (majority ? 'accent' : 'good') : undefined}>
          {caughtUp
            ? `공격자 체인(${attackerBlocks}블록)이 정직한 체인(${honestTotal}블록)을 따라잡았다. 재구성 발생. 가맹점이 받았다고 믿은 결제는 무효가 된다.`
            : safe
              ? majority
                ? `${MAX_ROUNDS}라운드 안에는 따라잡지 못했지만, 공격자가 과반이면 시간이 걸릴 뿐 결국 따라잡는다. 마지막 탭에서 확률로 확인한다.`
                : `${MAX_ROUNDS}라운드 안에는 공격자가 따라잡지 못했다. 과반 미만이면 격차가 벌어질수록 따라잡을 확률이 더 줄어든다.`
              : `${round}라운드 진행 중. 공격자가 정직한 체인을 따라잡을 수 있을지 지켜보자.`}
        </StatusBanner>

        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
          <Metric label='정직한 체인' value={`${honestTotal}블록`} />
          <Metric label='공격자 체인' value={`${attackerBlocks}블록`} tone={caughtUp ? 'bad' : 'accent'} />
          <Metric
            label='격차'
            value={`${honestTotal - attackerBlocks}블록`}
            tone={caughtUp ? 'bad' : majority ? 'accent' : 'good'}
            sub='정직한 체인 − 공격자 체인'
          />
        </div>
      </Panel>

      <ExplainCard
        title='왜 확인 수가 늘수록 안전해질까'
        preview='공격자 체인이 따라잡으려면, 뒤처진 블록 수만큼 연속으로 동전 던지기를 이겨야 한다.'
        body={
          <>
            공격자가 앞서려면 뒤처진 <b>{confirmations}블록</b>을 먼저 메우고, 그 후로도 계속 정직한 체인보다 빨리
            블록을 찾아야 한다. 확인 수가 늘수록 메워야 할 격차가 커지고, 해시레이트가 51%보다 작다면 격차를 메울 확률은
            격차 크기에 따라 기하급수적으로 줄어든다. 다음 탭에서 이 확률을 정확한 수식으로 계산해 본다.
          </>
        }
      />
    </div>
  );
}

// tone은 공용 어휘(good/bad/accent)를 그대로 쓴다. 여기서 로컬 어휘를 만들면
// 바로 아래 StatusBanner와 같은 사건에 다른 색이 붙는다. 공격자가 따라잡는 것은
// '승리'가 아니라 이 페이지가 경고하는 결과이므로 bad다.
// faded는 판정이 아니라 '이 체인은 버려졌다'는 표시라 tone과 따로 둔다.
function ChainRow({
  label,
  confirmed,
  extra,
  tone,
  faded,
}: {
  label: string;
  confirmed: number;
  extra: number;
  tone?: 'good' | 'bad' | 'accent';
  faded?: boolean;
}) {
  const total = confirmed + extra;
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-md border border-transparent bg-muted p-3',
        // 테두리를 칠하는 건 승부가 났을 때뿐이다. 여기서 결판나는 결과는 재구성 하나라 bad-surface만 쓴다.
        tone === 'bad' && 'border-bad-surface/40 bg-bad-surface/5',
        faded && 'bg-transparent opacity-50',
      )}
    >
      <div className='flex items-center justify-between'>
        <span className='text-sm font-medium'>{label}</span>
        <span className='text-xs text-muted-foreground tabular-nums'>블록 {total}개</span>
      </div>
      <div className='flex flex-wrap gap-1'>
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'size-4 rounded-xs',
              i < confirmed
                ? 'bg-series-1/60'
                : faded
                  ? 'bg-muted-foreground/30'
                  : tone === 'bad'
                    ? 'bg-bad-surface'
                    : tone === 'accent'
                      ? 'bg-warn-surface'
                      : 'bg-good-surface',
            )}
          />
        ))}
      </div>
    </div>
  );
}
