'use client';

import { useState } from 'react';
import { KeyRound, Link2 } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { ExplainCard, IllustrativeDisclaimer, RoundControls, SectionIntro } from '@/components/simulation';
import { useRoundEngine } from '@/hooks/use-round-engine';
import { cn, shortHex } from '@/lib/utils';
import { HTLC_HOPS, paymentHash, randomPreimage } from '@/lib/lightning-concept';

const MAX_STEP = 3;
const LINK_COUNT = HTLC_HOPS.length - 1;

const STEP_LABEL = [
  '아직 아무 채널도 잠기지 않았다.',
  'Alice→Carol, Carol→Bob 두 채널 모두 같은 해시 H로 HTLC를 건다: "R을 공개하면 지급, 아니면 시간 초과 후 환불".',
  'Bob이 R을 공개해 Carol에게서 자기 몫을 받는다. 이제 R이 공개 정보가 됐다.',
  'Carol이 그 R을 그대로 Alice에게 제시해 자기 몫을 받는다. 결제가 역방향으로 전파되며 완료됐다.',
];

export function HtlcRouting() {
  const [preimage, setPreimage] = useState(() => randomPreimage());
  const hash = paymentHash(preimage);

  const [step, setStep] = useState(0);
  const [speedMs, setSpeedMs] = useState(900);
  const done = step >= MAX_STEP;

  function advance(): boolean {
    if (done) return false;
    setStep((s) => s + 1);
    return step + 1 < MAX_STEP;
  }

  const engine = useRoundEngine(advance, speedMs);

  function reset() {
    engine.pause();
    setStep(0);
    setPreimage(randomPreimage());
  }

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='HTLC: 중계자를 믿지 않고도 여러 홉을 건넌다'>
        Alice가 Bob에게 직접 채널이 없어도, 둘 다 Carol과 채널이 있다면 Carol을 거쳐 보낼 수 있다. 문제는 &#39;Carol이
        중간에 돈만 받고 안 넘겨주면 어떡하나&#39;다. <b>해시 잠금 계약(HTLC)</b>은 Bob만 아는 비밀(R)을 공개해야 돈을
        풀 수 있게 걸어서, Carol이 배신할 수 없게 만든다.
      </SectionIntro>

      <Card className='flex flex-col gap-4 p-4'>
        <div className='grid grid-cols-1 gap-2 text-sm sm:grid-cols-2'>
          <div className='rounded-md border p-3'>
            <span className='text-muted-foreground text-xs'>Bob만 아는 비밀 (preimage R)</span>
            <p className='mt-1 font-mono text-sm'>{shortHex(preimage, 16)}</p>
          </div>
          <div className='rounded-md border p-3'>
            <span className='text-muted-foreground text-xs'>결제 해시 H = hash(R) (모두에게 공개)</span>
            <p className='mt-1 font-mono text-sm'>{shortHex(hash, 16)}</p>
          </div>
        </div>

        <RoundControls
          playing={engine.playing}
          onToggle={engine.toggle}
          onStep={advance}
          onReset={reset}
          round={step}
          speedMs={speedMs}
          onSpeed={setSpeedMs}
          done={done}
          unit='단계'
        />

        <div className='flex items-center justify-between gap-2'>
          {HTLC_HOPS.map((hop, i) => {
            // 정산은 Bob과 맞닿은 링크부터 역방향으로 전파된다: 마지막 링크가 2단계에 먼저 풀리고,
            // 그보다 앞선 링크일수록 한 단계씩 늦게(3단계, 4단계…) 풀린다.
            const settleStep = 2 + (LINK_COUNT - 1 - i);
            const linkState: 'idle' | 'locked' | 'settled' =
              step >= settleStep ? 'settled' : step >= 1 ? 'locked' : 'idle';
            return <HopNode key={hop} label={hop} isLast={i === HTLC_HOPS.length - 1} linkState={linkState} />;
          })}
        </div>

        <div className='bg-muted rounded-md border-transparent p-3 text-sm leading-relaxed'>{STEP_LABEL[step]}</div>
      </Card>

      <IllustrativeDisclaimer>
        해시 H는 실제 SHA-256이 아니라 결정적 가짜 값(개념 시연용)이다. HTLC의 해시 잠금·타임락 구조와 결제가 역방향으로
        전파되는 순서는 실제와 같다.
      </IllustrativeDisclaimer>

      <ExplainCard
        icon={<KeyRound className='size-4 text-amber-600 dark:text-amber-400' />}
        title='타임락은 왜 필요할까'
        preview='Bob이 끝내 R을 공개하지 않으면, 정해진 시간 뒤 각 홉은 걸어둔 돈을 자동으로 돌려받는다.'
        body={
          <>
            Bob이 R을 영영 공개하지 않으면 어떻게 될까. 각 HTLC에는 <b>타임락</b>도 함께 걸려 있어서, 정해진 시간이
            지나면 돈을 건 쪽이 자동으로 환불받는다. 그래서 Carol은 &#39;돈만 받고 안 넘길&#39; 수도 없고(해시락),
            &#39;영원히 묶여버릴&#39; 수도 없다(타임락). 라우팅 경로가 길어질수록 앞 홉의 타임락을 뒤 홉보다 조금씩 더
            길게 잡아, 뒤에서부터 안전하게 정산될 시간을 확보한다.
          </>
        }
      />
    </div>
  );
}

function HopNode({
  label,
  isLast,
  linkState,
}: {
  label: string;
  isLast: boolean;
  linkState: 'idle' | 'locked' | 'settled';
}) {
  return (
    <div className='flex flex-1 items-center'>
      <div className='flex flex-col items-center gap-1'>
        <div className='bg-muted flex size-10 items-center justify-center rounded-full border text-xs font-medium'>
          {label.slice(0, 1)}
        </div>
        <span className='text-muted-foreground text-[11px]'>{label}</span>
      </div>
      {!isLast && (
        <div className='mx-2 flex-1'>
          <Link2
            className={cn(
              'mx-auto size-4',
              linkState === 'settled'
                ? 'text-emerald-500'
                : linkState === 'locked'
                  ? 'text-amber-500'
                  : 'text-muted-foreground/30',
            )}
          />
          <div
            className={cn(
              'mt-1 h-1 rounded-full',
              linkState === 'settled' ? 'bg-emerald-500' : linkState === 'locked' ? 'bg-amber-500' : 'bg-muted',
            )}
          />
        </div>
      )}
    </div>
  );
}
