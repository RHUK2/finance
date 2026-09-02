'use client';

import { useMemo, useState } from 'react';

import { CheckCircle2, Eye, XCircle } from 'lucide-react';

import { Field, Metric, SectionIntro, SegmentedControl, StatusBanner } from '@/components/simulation';
import { Card } from '@/components/ui/card';

import { CurveGrid, type GridMark } from './curve-grid';
import { MULTIPLES_OF_G, N, fmtPt, mod, mulPt, sign, verify } from './models';

type Tamper = 'none' | 'z' | 's';

const TAMPER_OPTIONS: { value: Tamper; label: string }[] = [
  { value: 'none', label: '원래 그대로' },
  { value: 'z', label: '메시지를 바꿔치기' },
  { value: 's', label: '서명을 손대기' },
];

export function VerifyLab({ d, z, k }: { d: number; z: number; k: number }) {
  const [tamper, setTamper] = useState<Tamper>('none');

  const Q = MULTIPLES_OF_G[d];
  const sig = useMemo(() => sign(d, z, k), [d, z, k]);

  // 검증자에게 넘어가는 값만 골라 쓴다. 개인키 d와 일회용 비밀값 k는 여기 없다.
  const zSeen = tamper === 'z' ? mod(z + 1, N) : z;
  const sSeen = tamper === 's' ? mod(sig.s + 1, N) : sig.s;
  const res = useMemo(() => verify(Q, zSeen, sig.r, sSeen), [Q, zSeen, sig.r, sSeen]);

  const u1G = mulPt(res.u1, MULTIPLES_OF_G[1]);
  const u2Q = mulPt(res.u2, Q);

  const marks: GridMark[] = [];
  if (u1G) marks.push({ ...u1G, label: `u₁G`, className: 'fill-sky-500' });
  if (u2Q) marks.push({ ...u2Q, label: `u₂Q`, className: 'fill-violet-500' });
  if (res.X) marks.push({ ...res.X, label: 'u₁G + u₂Q', className: res.ok ? 'fill-emerald-500' : 'fill-rose-500' });

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='개인키 없이 같은 점을 되살린다'>
        검증자가 손에 쥔 것은 넷뿐이다. 공개키 Q, 메시지 해시 z, 그리고 서명 (r, s). 개인키도 일회용 비밀값도 없다.
        그런데 이 넷만으로 서명자가 만들었던 점 R을 그대로 되살릴 수 있다. 서명식 s = k⁻¹(z + r·d)를 k에 대해 풀면 k =
        s⁻¹(z + r·d)이고, 양변에 G를 곱하면 kG = s⁻¹z·G + s⁻¹r·(dG)가 된다. 오른쪽 마지막 항의 dG가 바로 공개키 Q라,
        개인키를 모르는 사람도 이 식을 계산할 수 있다.
      </SectionIntro>

      <Card className='flex flex-col gap-3 p-4'>
        <span className='flex items-center gap-1.5 text-sm font-semibold'>
          <Eye className='size-4 text-sky-500' />
          검증자가 아는 값
        </span>
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
          <Metric label='공개키 Q' value={fmtPt(Q)} />
          <Metric label='메시지 해시 z' value={`${zSeen}`} tone={tamper === 'z' ? 'bad' : undefined} />
          <Metric label='서명 r' value={`${sig.r}`} />
          <Metric label='서명 s' value={`${sSeen}`} tone={tamper === 's' ? 'bad' : undefined} />
        </div>
        <Field label='검증할 것을 바꿔 본다'>
          <SegmentedControl options={TAMPER_OPTIONS} value={tamper} onChange={setTamper} />
          <p className='text-muted-foreground text-xs'>
            서명은 그대로 두고 메시지만 1 바꾸거나, 메시지는 그대로 두고 서명을 1 바꾼다. 어느 쪽이든 복원되는 점이
            달라진다.
          </p>
        </Field>
      </Card>

      <Card className='flex flex-col gap-2 p-4'>
        <span className='text-sm font-semibold'>네 단계</span>
        <Line
          label='w = s⁻¹ mod n'
          value={`${sSeen}⁻¹ mod ${N} = ${res.w}`}
          note={`검산: ${sSeen} × ${res.w} = ${sSeen * res.w} ≡ ${mod(sSeen * res.w, N)}`}
        />
        <Line label='u₁ = z·w mod n' value={`${zSeen} × ${res.w} mod ${N} = ${res.u1}`} note='메시지 몫' />
        <Line label='u₂ = r·w mod n' value={`${sig.r} × ${res.w} mod ${N} = ${res.u2}`} note='공개키 몫' />
        <Line
          label='X = u₁G + u₂Q'
          value={`${fmtPt(u1G)} + ${fmtPt(u2Q)} = ${fmtPt(res.X)}`}
          note={
            res.X === null
              ? '무한원점이 나오면 그 자리에서 검증 실패다'
              : `x좌표 ${res.X.x}를 n으로 나눈 나머지는 ${res.xModN}, 서명의 r은 ${sig.r}`
          }
        />
      </Card>

      <Card className='flex flex-col gap-3 p-4'>
        <span className='text-sm font-semibold'>격자에서 두 점을 더해 X를 얻는다</span>
        <CurveGrid
          marks={marks}
          caption={
            res.ok
              ? '복원된 X가 서명할 때 만들었던 R과 같은 점이다. 검증자는 R을 본 적이 없는데도 같은 자리에 닿았다.'
              : '복원된 X가 엉뚱한 자리에 떨어졌다. 재료 하나만 어긋나도 전혀 다른 점이 나온다.'
          }
        />
      </Card>

      {res.ok ? (
        <StatusBanner icon={<CheckCircle2 className='size-4' />} tone='good'>
          x(X) mod n = {res.xModN} = r. 서명이 유효하다. 개인키를 쓰지 않고 확인했다.
        </StatusBanner>
      ) : (
        <StatusBanner icon={<XCircle className='size-4' />} tone='bad'>
          x(X) mod n = {res.xModN ?? '없음'} ≠ r = {sig.r}. 검증 실패다.
          {tamper === 'z' &&
            ' 서명은 손대지 않았는데도 메시지가 바뀌자 무효가 됐다. 서명이 메시지에 묶여 있다는 뜻이다.'}
          {tamper === 's' && ' 서명 숫자 하나를 1 바꿨을 뿐인데 무효가 됐다. 그럴듯한 서명을 지어낼 수 없다는 뜻이다.'}
        </StatusBanner>
      )}

      <p className='text-muted-foreground text-sm/relaxed'>
        여기까지가 ECDSA 전부다. 곡선 위의 덧셈 하나로 키를 만들고, 일회용 비밀값으로 점 하나를 만들어 서명하고, 그 점을
        개인키 없이 되살려 검증한다. 남은 질문은 하나다. 이걸 왜 깨뜨릴 수 없는가, 그리고 언제 깨지는가.
      </p>
    </div>
  );
}

function Line({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className='flex flex-col rounded-md border px-3 py-2'>
      <div className='flex flex-wrap items-baseline justify-between gap-x-3'>
        <span className='text-sm font-medium'>{label}</span>
        <span className='text-sm tabular-nums'>{value}</span>
      </div>
      <span className='text-muted-foreground text-xs'>{note}</span>
    </div>
  );
}
