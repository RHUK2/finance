'use client';

import { useMemo, useState } from 'react';

import { Copy, ShieldCheck, ShieldOff } from 'lucide-react';

import {
  ExplainCard,
  Field,
  SectionIntro,
  SegmentedControl,
  StatCard,
  StatusBanner,
  StepPanel,
} from '@/components/simulation';
import { Card } from '@/components/ui/card';

import { SEND_AMOUNT, SPLIT_KINDS, type SplitKind, protectionAvailable, replayPossible, replayStages } from './models';

const btc = (n: number) => `${n.toFixed(2)} BTC`;

export function ReplayAttack() {
  const [kind, setKind] = useState<SplitKind>('soft');
  const [protection, setProtection] = useState(false);
  const [step, setStep] = useState(0);

  const stages = useMemo(() => replayStages(kind, protection), [kind, protection]);
  const stage = stages[step];
  const canProtect = protectionAvailable(kind);
  const replayed = replayPossible(kind, protection);

  // 분기가 나기 전에는 갈라진 체인이 없으므로 잔고 카드를 비워 둔다.
  const forked = step === 0 ? null : stage.forked;
  // 리플레이가 실제로 일어난 시점은 4단계다. 그 전까지는 결론을 앞질러 말하지 않는다.
  const settled = step >= 3;

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='개인키를 넘긴 적이 없는데 반대편 잔고가 나간다'>
        리플레이는 뚫리는 사건이 아니다. 서명된 트랜잭션은 브로드캐스트되는 순간 공개되고, 두 체인이 같은 과거를
        공유하면 그 트랜잭션이 반대편에서도 그대로 유효하다. 누구든 복사해서 던지기만 하면 된다. 아래에서 분기 유형을
        바꿔 가며 다섯 단계를 따라가 보자. 잔고와 금액은 설명을 위한 가상의 값이다.
      </SectionIntro>

      <Card className='flex flex-col gap-4 p-4'>
        <Field label='분기 유형'>
          <SegmentedControl
            value={kind}
            onChange={(v) => {
              setKind(v);
              setStep(0);
            }}
            options={SPLIT_KINDS}
          />
        </Field>
        <Field label='리플레이 보호'>
          <SegmentedControl
            value={protection}
            onChange={(v) => {
              setProtection(v);
              setStep(0);
            }}
            options={[
              { value: false, label: '없음' },
              { value: true, label: '있음' },
            ]}
            disabled={!canProtect}
          />
          <p className='text-muted-foreground text-xs'>
            {canProtect
              ? 'eCash처럼 하드포크로 갈라지는 체인은 규칙에 보호를 넣을 수 있다. 넣을지 말지는 분기를 만드는 쪽이 정한다.'
              : '소프트포크 분기에서는 고를 수 없다. 보호란 기존 체인에서 무효인 트랜잭션을 유효로 만드는 일이라 규칙이 넓어지고, 그 순간 소프트포크가 아니게 되기 때문이다.'}
          </p>
        </Field>
      </Card>

      <div className='grid grid-cols-2 gap-3'>
        <StatCard
          label='다수 체인 잔고'
          value={stage.main}
          format={btc}
          tone={step >= 2 ? 'accent' : undefined}
          sub={step >= 2 ? `${SEND_AMOUNT} BTC를 직접 보냈다` : '내가 원래 쥔 잔고'}
        />
        {forked === null ? (
          <Card className='gap-1 p-4'>
            <span className='text-muted-foreground text-xs'>분기 체인 잔고</span>
            <span className='text-muted-foreground text-xl font-semibold sm:text-2xl'>—</span>
            <span className='text-muted-foreground text-xs'>아직 분기 전이다</span>
          </Card>
        ) : (
          <StatCard
            label='분기 체인 잔고'
            value={forked}
            format={btc}
            tone={settled ? (replayed ? 'bad' : 'good') : undefined}
            sub={
              settled
                ? replayed
                  ? '보낸 적 없는데 같이 나갔다'
                  : '보호가 복사 전송을 막았다'
                : '같은 개인키가 지배한다'
            }
          />
        )}
      </div>

      {settled && (
        <StatusBanner
          tone={replayed ? 'bad' : 'good'}
          icon={replayed ? <ShieldOff className='size-5 shrink-0' /> : <ShieldCheck className='size-5 shrink-0' />}
        >
          <div>
            <p className='font-semibold'>
              {replayed
                ? `한 번 서명했는데 합쳐서 ${(SEND_AMOUNT * 2).toFixed(1)} BTC가 나갔다`
                : `보낸 쪽에서만 ${SEND_AMOUNT} BTC가 나갔다`}
            </p>
            <p className='text-muted-foreground mt-0.5 text-xs font-normal'>
              {replayed
                ? '지갑도 노드도 정상 동작했고 개인키도 안전하다. 두 체인이 같은 트랜잭션을 똑같이 유효하다고 판단했을 뿐이다.'
                : '보유자가 분기를 몰랐어도 결과가 같다. 그래서 리플레이 보호는 보유자의 주의가 아니라 분기 설계자의 책임이다.'}
            </p>
          </div>
        </StatusBanner>
      )}

      <ExplainCard
        icon={<Copy className='size-4 text-rose-500' />}
        title='왜 복사한 트랜잭션이 그대로 통하는가'
        preview='서명은 트랜잭션 내용에 대한 것이지, 어느 체인에 실릴지에 대한 것이 아니다'
        body={
          <div className='flex flex-col gap-2'>
            <p>
              서명이 보증하는 것은 &lsquo;이 입력을 이 출력으로 보내겠다&rsquo;는 내용이다. 어느 체인에 실릴지는 서명
              대상에 들어 있지 않다. 분기 시점까지의 과거가 같으면 같은 입력(UTXO)이 양쪽 체인에 똑같이 존재하고, 그
              입력을 쓰겠다는 서명도 양쪽에서 똑같이 검증을 통과한다.
            </p>
            <p>
              리플레이 보호란 이 빈칸을 메우는 일이다. 서명 대상에 체인을 식별하는 값을 끼워 넣으면, 한쪽 체인용으로
              계산된 서명은 반대편에서 검증에 실패한다. 다만 그렇게 만든 트랜잭션은 기존 체인에서 무효이므로, 그 체인
              입장에서는 <b>없던 유효성이 생긴</b> 것이다. 규칙을 넓히는 변경이라 하드포크에서만 가능하다.
            </p>
            <p>
              복사해서 던지는 쪽이 얻는 것도 짚어 둘 만하다. 공격자가 남의 코인을 가져가는 게 아니다. 받는 쪽 주소를 쥔
              사람이 양쪽에서 다 받게 되는 것이고, 그래서 리플레이는 대개 공격이라기보다 수취인이 가만히 있어도 굴러
              들어오는 이득에 가깝다. 손해는 전적으로 보내는 쪽이 본다.
            </p>
          </div>
        }
      />

      <StepPanel
        step={step}
        total={stages.length}
        title={stage.title}
        narration={stage.narration}
        onPrev={() => setStep((s) => Math.max(0, s - 1))}
        onNext={() => setStep((s) => Math.min(stages.length - 1, s + 1))}
        onReset={() => setStep(0)}
        onJump={setStep}
      />
    </div>
  );
}
