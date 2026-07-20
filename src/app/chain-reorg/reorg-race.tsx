'use client';

import { useState } from 'react';
import { GitFork, ShieldOff } from 'lucide-react';

import { Card } from '@/components/ui/card';
import {
  ControlSlider,
  ExplainCard,
  IllustrativeDisclaimer,
  Metric,
  RoundControls,
  SectionIntro,
  StatusBanner,
} from '@/components/simulation';
import { useRoundEngine } from '@/hooks/use-round-engine';
import { cn, mulberry32 } from '@/lib/utils';

const MAX_ROUNDS = 60; // 이 라운드까지 못 따라잡으면 "충분히 안전"으로 간주하고 멈춘다

export function ReorgRace() {
  const [attackPct, setAttackPct] = useState(20);
  const [confirmations, setConfirmations] = useState(3);

  const [seed, setSeed] = useState(1);
  const [round, setRound] = useState(0);
  const [honestExtra, setHonestExtra] = useState(0);
  const [attackerBlocks, setAttackerBlocks] = useState(0);
  const [speedMs, setSpeedMs] = useState(400);

  const q = attackPct / 100;
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
        <b>없는</b> 비밀 체인을 그 이전 블록부터 몰래 채굴하기 시작한다. 공격자의 체인이 정직한 체인보다 길어지는 순간,
        네트워크는 더 긴(작업량이 많은) 체인을 채택하고 정직한 체인의 블록들은 통째로 고아가 된다. 그 안의 트랜잭션도
        함께 무효가 된다. 재생을 눌러 두 체인이 경주하는 걸 보자.
      </SectionIntro>

      <Card className='flex flex-col gap-4 p-4'>
        <ControlSlider
          icon={<GitFork className='size-4 text-amber-600 dark:text-amber-400' />}
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
          icon={<ShieldOff className='text-muted-foreground size-4' />}
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
          format={(v) => `${v}confirm`}
        />
      </Card>

      <Card className='flex flex-col gap-3 p-4'>
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
          tone={caughtUp ? 'orphan' : 'safe'}
        />
        <ChainRow
          label='공격자의 비밀 체인'
          confirmed={0}
          extra={attackerBlocks}
          tone={caughtUp ? 'winner' : 'losing'}
        />

        <StatusBanner tone={caughtUp ? 'bad' : safe ? 'good' : undefined}>
          {caughtUp
            ? `공격자 체인(${attackerBlocks}블록)이 정직한 체인(${honestTotal}블록)을 따라잡았다. 재구성 발생. 가맹점이 받았다고 믿은 결제는 무효가 된다.`
            : safe
              ? `${MAX_ROUNDS}라운드 동안 공격자가 따라잡지 못했다. 이 정도면 사실상 안전하다고 본다.`
              : `${round}라운드 진행 중. 공격자가 정직한 체인을 따라잡을 수 있을지 지켜보자.`}
        </StatusBanner>

        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
          <Metric label='정직한 체인' value={`${honestTotal}블록`} tone='good' />
          <Metric label='공격자 체인' value={`${attackerBlocks}블록`} tone={caughtUp ? 'bad' : 'accent'} />
          <Metric label='격차' value={`${honestTotal - attackerBlocks}블록`} />
        </div>
      </Card>

      <IllustrativeDisclaimer>
        여기서는 매 라운드 &#39;누가 다음 블록을 찾는가&#39;를 공격자 해시레이트 비중으로 동전 던지듯 결정한다. 실제로는
        각 채굴자가 독립적으로 포아송 과정을 따르지만, 결과 확률은 동일하다. 이 라운드 방식은 그 과정을 눈으로 보여주는
        것일 뿐 확률 자체를 왜곡하지 않는다.
      </IllustrativeDisclaimer>

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

function ChainRow({
  label,
  confirmed,
  extra,
  tone,
}: {
  label: string;
  confirmed: number;
  extra: number;
  tone: 'safe' | 'orphan' | 'winner' | 'losing';
}) {
  const total = confirmed + extra;
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-md border p-3',
        tone === 'winner' && 'border-emerald-500/40 bg-emerald-500/5',
        tone === 'orphan' && 'border-transparent opacity-50',
        (tone === 'safe' || tone === 'losing') && 'bg-muted border-transparent',
      )}
    >
      <div className='flex items-center justify-between'>
        <span className='text-sm font-medium'>{label}</span>
        <span className='text-muted-foreground text-xs tabular-nums'>블록 {total}개</span>
      </div>
      <div className='flex flex-wrap gap-1'>
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-4 w-4 rounded-[3px]',
              i < confirmed
                ? 'bg-sky-500/60'
                : tone === 'winner'
                  ? 'bg-emerald-500'
                  : tone === 'orphan'
                    ? 'bg-muted-foreground/30'
                    : tone === 'losing'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500',
            )}
          />
        ))}
      </div>
    </div>
  );
}
