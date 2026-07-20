'use client';

import { useState } from 'react';
import { Flag, Vote } from 'lucide-react';

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
import {
  BIP9_STATE_LABEL,
  type Bip9State,
  epochSignalRatio,
  MAX_PERIODS,
  nextBip9State,
  SIGNAL_THRESHOLD,
} from '@/lib/soft-fork-concept';

export function Bip9Signaling() {
  const [supportPct, setSupportPct] = useState(70);

  const [seed, setSeed] = useState(1);
  const [round, setRound] = useState(0);
  const [state, setState] = useState<Bip9State>('STARTED');
  const [history, setHistory] = useState<number[]>([]);
  const [speedMs, setSpeedMs] = useState(700);

  const finished = state === 'ACTIVE' || state === 'FAILED';

  function step(): boolean {
    if (finished) return false;
    if (state === 'LOCKED_IN') {
      setState('ACTIVE');
      return false;
    }
    const rng = mulberry32(seed * 7_919 + round);
    const ratio = epochSignalRatio(supportPct / 100, rng);
    const nextRound = round + 1;
    const next = nextBip9State(state, ratio, nextRound);

    setHistory((h) => [...h, ratio]);
    setRound(nextRound);
    setState(next);

    return next === 'STARTED';
  }

  const engine = useRoundEngine(step, speedMs);

  function reset() {
    engine.pause();
    setSeed((s) => s + 1);
    setRound(0);
    setState('STARTED');
    setHistory([]);
  }

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='BIP9 시그널링: 채굴자 투표로 활성화 시점을 정한다'>
        새 소프트포크 규칙이 정해지면, 채굴자들은 블록 헤더의 버전 비트에 &#39;준비됐다&#39;는 신호를 실어 보낸다. 한
        기간(2016블록, 약 2주) 동안 신호를 보낸 블록 비율이 <b>{(SIGNAL_THRESHOLD * 100).toFixed(0)}%</b>를 넘으면
        확정(LOCKED_IN)되고, 그 다음 기간부터 활성화(ACTIVE)된다. {MAX_PERIODS}기간 안에 못 넘기면 이 시도는
        실패(FAILED)한다.
      </SectionIntro>

      <Card className='flex flex-col gap-4 p-4'>
        <ControlSlider
          icon={<Vote className='size-4 text-amber-600 dark:text-amber-400' />}
          label='채굴자 지지율'
          value={supportPct}
          onChange={(v) => {
            setSupportPct(v);
            reset();
          }}
          min={50}
          max={100}
          step={1}
          format={(v) => `${v}%`}
        />

        <RoundControls
          playing={engine.playing}
          onToggle={engine.toggle}
          onStep={step}
          onReset={reset}
          round={round}
          speedMs={speedMs}
          onSpeed={setSpeedMs}
          done={finished}
          unit='기간'
        />

        <div className='flex flex-col gap-1.5'>
          {Array.from({ length: MAX_PERIODS }).map((_, i) => {
            const ratio = history[i];
            const reached = ratio !== undefined;
            const passed = reached && ratio >= SIGNAL_THRESHOLD;
            return (
              <div key={i} className='flex items-center gap-2 text-xs'>
                <span className='text-muted-foreground w-14 shrink-0'>{i + 1}기간</span>
                <div className='bg-muted h-3 w-full overflow-hidden rounded-full'>
                  {reached && (
                    <div
                      className={cn('h-full rounded-full', passed ? 'bg-emerald-500' : 'bg-amber-500')}
                      style={{ width: `${Math.max(1, ratio * 100)}%` }}
                    />
                  )}
                </div>
                <span className='w-12 text-right tabular-nums'>{reached ? `${(ratio * 100).toFixed(0)}%` : '-'}</span>
              </div>
            );
          })}
        </div>

        <StatusBanner
          tone={state === 'ACTIVE' ? 'good' : state === 'FAILED' ? 'bad' : state === 'LOCKED_IN' ? 'accent' : undefined}
          icon={
            <Flag
              className={cn(
                'size-4 shrink-0',
                state === 'ACTIVE' && 'text-emerald-600 dark:text-emerald-400',
                state === 'FAILED' && 'text-rose-600 dark:text-rose-400',
                state === 'LOCKED_IN' && 'text-amber-600 dark:text-amber-400',
                state === 'STARTED' && 'text-muted-foreground',
              )}
            />
          }
        >
          현재 상태: {BIP9_STATE_LABEL[state]}
        </StatusBanner>

        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
          <Metric label='경과 기간' value={`${round} / ${MAX_PERIODS}`} />
          <Metric
            label='임계값'
            value={`${(SIGNAL_THRESHOLD * 100).toFixed(0)}%`}
            sub={`채굴자 지지율 ${supportPct}% 설정`}
          />
          <Metric
            label='결과'
            value={state === 'ACTIVE' ? '활성화' : state === 'FAILED' ? '실패' : '진행 중'}
            tone={state === 'ACTIVE' ? 'good' : state === 'FAILED' ? 'bad' : 'accent'}
          />
        </div>
      </Card>

      <IllustrativeDisclaimer>
        실제 기간은 2016블록(약 2주)이고 타임아웃도 프로젝트마다 다르다(예: 최초 BIP9 설계는 약 1년). 여기서는 여러
        기간을 몇 초 안에 재생할 수 있도록 기간 수를 크게 줄였을 뿐, 임계값·상태 전이 규칙은 실제와 같다.
      </IllustrativeDisclaimer>

      <ExplainCard
        title='지지율이 임계값에 살짝 못 미치면 무슨 일이 벌어질까'
        preview='94%처럼 임계값에 아주 가까워도, 기간 안에 95%를 못 넘기면 이 시도는 그냥 실패로 끝난다.'
        body={
          <>
            BIP9는 &#39;거의 다 왔다&#39;는 걸 봐주지 않는다. 정해진 기간 안에 정확히 임계값을 넘기지 못하면 그
            소프트포크 시도는 실패로 끝나고, 처음부터 다시 제안해야 한다. 이 &#39;전부 아니면 전무&#39; 방식 때문에,
            지지율이 임계값 근처에서 오래 정체되는 소프트포크는 영영 활성화되지 못할 수 있다. 다음 탭에서 다루는 BIP8이
            등장한 배경이다.
          </>
        }
      />
    </div>
  );
}
