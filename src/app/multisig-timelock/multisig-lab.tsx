'use client';

import { useMemo, useState } from 'react';
import { CircleCheck, CircleX } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { ControlSlider, ExplainCard, Field, Metric, SectionIntro, StatusBanner } from '@/components/simulation';
import { cn, shortHex } from '@/lib/utils';
import { illustrativePubKey } from '@/lib/script-concept';

const MAX_N = 5;

function keyLabel(i: number) {
  return String.fromCharCode('A'.charCodeAt(0) + i); // 서명자 A, B, C ...
}

export function MultisigLab() {
  const [n, setN] = useState(3);
  const [m, setM] = useState(2);
  // 서명자별 "유효한 서명을 냈는가". 항상 길이 n을 유지한다. 기본값은 앞쪽 m명만 서명한 상태로 시작.
  const [signed, setSigned] = useState<boolean[]>([true, true, false]);

  const pubKeys = useMemo(() => Array.from({ length: n }, (_, i) => illustrativePubKey(`multisig-${i}`)), [n]);

  function changeN(v: number) {
    setN(v);
    setM((prev) => Math.min(prev, v));
    setSigned((prev) => Array.from({ length: v }, (_, i) => prev[i] ?? false));
  }

  function toggle(i: number) {
    setSigned((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  }

  const validCount = signed.filter(Boolean).length;
  const unlocked = validCount >= m;

  const scriptPubKey = `OP_${m} ${pubKeys.map((k) => `<${shortHex(k, 8)}>`).join(' ')} OP_${n} OP_CHECKMULTISIG`;
  const scriptSig = `OP_0 ${signed
    .map((v, i) => (v ? `<sig${keyLabel(i)}>` : null))
    .filter(Boolean)
    .join(' ')}`;

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='M-of-N 다중서명: 여러 키 중 일부만 있어도 된다'>
        지금까지 본 잠금은 키 하나로 풀렸다. <b>OP_CHECKMULTISIG</b>는 미리 등록해 둔 N개의 공개키 중 최소 M개의 유효한
        서명이 모이면 지출을 허용한다. N·M과 실제로 서명한 사람을 바꿔가며 언제 잠금이 풀리는지 확인해 보자.
      </SectionIntro>

      <Card className='flex flex-col gap-4 p-4'>
        <ControlSlider
          label='전체 키 개수 (N)'
          value={n}
          onChange={changeN}
          min={2}
          max={MAX_N}
          format={(v) => `${v}개`}
        />
        <ControlSlider
          label='필요한 최소 서명 수 (M)'
          value={m}
          onChange={setM}
          min={1}
          max={n}
          format={(v) => `${v}개`}
        />

        <Field label='서명자별 서명 여부 (눌러서 토글)'>
          <div className='flex flex-wrap gap-2'>
            {Array.from({ length: n }, (_, i) => (
              <button
                key={i}
                onClick={() => toggle(i)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                  signed[i]
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                {signed[i] ? <CircleCheck className='size-4' /> : <CircleX className='size-4' />}
                서명자 {keyLabel(i)}
              </button>
            ))}
          </div>
        </Field>
      </Card>

      <StatusBanner tone={unlocked ? 'good' : 'bad'}>
        {unlocked
          ? `유효한 서명 ${validCount}개 ≥ 필요 서명 ${m}개 → 지출 허용`
          : `유효한 서명 ${validCount}개 < 필요 서명 ${m}개 → 지출 거부`}
      </StatusBanner>

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
        <Metric label='서명한 사람' value={`${validCount} / ${n}`} tone={unlocked ? 'good' : 'bad'} />
        <Metric label='정족수' value={`${m}-of-${n}`} tone='accent' />
        <Metric label='결과' value={unlocked ? '지출 허용' : '지출 거부'} tone={unlocked ? 'good' : 'bad'} />
      </div>

      <Card className='flex flex-col gap-2 p-4'>
        <span className='text-sm font-medium'>스크립트</span>
        <div className='flex flex-col gap-1.5 font-mono text-xs'>
          <div className='bg-muted rounded-md p-2'>
            <span className='text-muted-foreground mr-2'>scriptPubKey (잠금)</span>
            <div className='mt-1 break-all'>{scriptPubKey}</div>
          </div>
          <div className='bg-muted rounded-md p-2'>
            <span className='text-muted-foreground mr-2'>scriptSig (풀이)</span>
            <div className='mt-1 break-all'>{scriptSig || '(서명 없음)'}</div>
          </div>
        </div>
      </Card>

      <ExplainCard
        title='scriptSig 맨 앞의 OP_0은 왜 있을까'
        preview='OP_CHECKMULTISIG 구현에 있는 오프바이원 버그 때문에, 스택에서 여분으로 하나를 더 소비한다.'
        body='초기 비트코인 코어의 OP_CHECKMULTISIG 구현에 스택에서 인자를 하나 더 꺼내 버리는 사소한 버그가 있었다. 이미 여러 트랜잭션이 이 동작에 맞춰 만들어진 뒤였기 때문에, 버그를 고치는 대신 그 여분의 자리를 채우는 더미 값(OP_0)을 관례로 넣는 쪽으로 굳어졌다. 오늘날까지도 P2SH·레거시 멀티시그는 이 더미 값 없이는 검증에 실패한다.'
      />
      <ExplainCard
        title='서명 순서도 공개키 순서와 맞아야 한다'
        preview='OP_CHECKMULTISIG는 서명들을 공개키 목록과 같은 순서로 훑으며 매칭한다.'
        body='OP_CHECKMULTISIG는 스택에 쌓인 서명들을 공개키 목록 순서대로 하나씩 대조한다. 서명 자체는 순서를 건너뛸 수 있어도(예: A·C만 서명해도 B를 건너뛰고 매칭), 서명들이 나열된 순서가 공개키 나열 순서를 거슬러 올라가면 검증에 실패한다. 그래서 지갑 소프트웨어는 서명을 모을 때 항상 공개키 순서에 맞춰 재정렬한다.'
      />
      <ExplainCard
        title='실전에서는 이렇게 쓰인다'
        preview='거래소 콜드월렛, DAO 금고, 2인 이상 승인이 필요한 기업 자금 등 단일 키 분실·탈취 위험을 분산하는 용도.'
        body='2-of-3은 흔한 조합이다. 예를 들어 회사·감사인·백업 보관소 세 곳이 키를 하나씩 나눠 갖고, 실제 지출에는 그중 둘의 동의만 있으면 되도록 설계한다. 키 하나를 도난당하거나 잃어버려도 자금은 안전하고, 동시에 어느 한 사람이 독단적으로 자금을 빼돌릴 수도 없다. 거래소 콜드월렛, DAO 금고, 상속·에스크로 계약이 이 패턴을 널리 쓴다.'
      />
    </div>
  );
}
