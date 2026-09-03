'use client';

import { useMemo } from 'react';

import { AlertTriangle, Dices, PenLine } from 'lucide-react';

import { ControlSlider, ExplainCard, SectionIntro, StatusBanner } from '@/components/simulation';
import { Card } from '@/components/ui/card';

import { CurveGrid } from './curve-grid';
import { MULTIPLES_OF_G, N, P, fmtPt, inv, mod, sign } from './models';

export function SignLab({
  d,
  z,
  k,
  onChangeD,
  onChangeZ,
  onChangeK,
}: {
  d: number;
  z: number;
  k: number;
  onChangeD: (v: number) => void;
  onChangeZ: (v: number) => void;
  onChangeK: (v: number) => void;
}) {
  const Q = MULTIPLES_OF_G[d];
  const sig = useMemo(() => sign(d, z, k), [d, z, k]);
  const { R, r, s, invalid } = sig;
  const kInv = inv(k, N);
  const inner = mod(z + r * d, N);

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='서명은 곡선 위의 점 하나와 정수 하나다'>
        서명이 하는 일은 개인키를 드러내지 않으면서 개인키를 안다는 사실만 증명하는 것이다. 방법은 이렇다. 매번 새로운
        비밀 정수 k를 골라 kG라는 점을 만들고, 그 점의 x좌표를 r로 삼는다. 그리고 k와 d와 z를 한 식에 엮어 s를 만든다.
        서명은 이 (r, s) 두 정수다. 여기서 d는 s 안에 섞여 들어가지만 k에 가려져 밖으로 나오지 않는다.
      </SectionIntro>

      <Card className='gap-4 p-4'>
        <ControlSlider
          label='개인키 d'
          hint='서명하는 사람만 아는 값. 이 값이 서명 밖으로 새어 나가지 않는 것이 전부다.'
          value={d}
          onChange={onChangeD}
          min={1}
          max={N - 1}
          step={1}
          format={(v) => `${v}`}
        />
        <ControlSlider
          label='메시지 해시 z'
          hint={`실제로는 메시지를 SHA-256으로 해시한 뒤 n = ${N}으로 나눈 나머지가 여기 들어간다. 해시 자체는 이 페이지의 주제가 아니라 값을 직접 고르게 뒀다.`}
          value={z}
          onChange={onChangeZ}
          min={0}
          max={N - 1}
          step={1}
          format={(v) => `${v}`}
        />
        <ControlSlider
          icon={<Dices className='size-4 text-amber-500' />}
          label='일회용 비밀값 k'
          hint='서명 한 번에만 쓰고 버린다. 바깥에서는 흔히 nonce라 부르지만 채굴의 nonce와는 다른 것이다. 채굴 nonce는 남들이 다 보는 값이고, 이 값은 새어 나가면 개인키가 함께 나간다.'
          value={k}
          onChange={onChangeK}
          min={1}
          max={N - 1}
          step={1}
          format={(v) => `${v}`}
        />
      </Card>

      <Card className='flex flex-col gap-3 p-4'>
        <span className='flex items-center gap-1.5 text-sm font-semibold'>
          <PenLine className='size-4 text-emerald-500' />세 단계로 끝난다
        </span>
        <div className='flex flex-col gap-2'>
          <Step
            n={1}
            title={`R = kG = ${k}G = ${fmtPt(R)}`}
            body={`일회용 비밀값을 스칼라 곱해 점 하나를 만든다. 점 덧셈과 스칼라 곱 탭에서 개인키로 공개키를 만든 것과 똑같은 연산이다.`}
          />
          <Step
            n={2}
            title={`r = x(R) mod n = ${R === null ? '없음' : R.x} mod ${N} = ${r}`}
            body={
              R !== null && R.x >= N
                ? `x좌표가 ${R.x}로 n = ${N}보다 커서 접혔다. p = ${P}가 n보다 큰 곡선에서는 늘 일어나는 일이고, secp256k1에서도 p > n이라 마찬가지다.`
                : `x좌표가 이미 n보다 작아 그대로 r이 된다. 점의 y좌표는 여기서 버려진다. 그래서 서명만 보고는 R을 하나로 특정하지 못한다.`
            }
          />
          <Step
            n={3}
            title={`s = k⁻¹(z + r·d) mod n = ${kInv} × ${inner} mod ${N} = ${s}`}
            body={`괄호 안은 ${z} + ${r} × ${d} = ${z + r * d}, n으로 나눈 나머지가 ${inner}이다. k의 역원은 ${kInv}이고(${k} × ${kInv} = ${k * kInv} ≡ ${mod(k * kInv, N)}), 이 둘을 곱해 다시 n으로 나눈 나머지가 s다.`}
          />
        </div>
      </Card>

      <Card className='flex flex-col gap-3 p-4'>
        <span className='text-sm font-semibold'>격자 위의 두 점</span>
        <CurveGrid
          marks={[
            ...(Q ? [{ ...Q, label: `Q = ${d}G (공개)`, className: 'fill-sky-500' }] : []),
            ...(R ? [{ ...R, label: `R = ${k}G (버린다)`, className: 'fill-amber-500' }] : []),
          ]}
          caption='공개키 Q는 남고 R은 서명이 끝나면 버려진다. 남는 것은 R의 x좌표를 n으로 접은 r뿐이다. 다음 탭에서 검증자가 이 R을 개인키 없이 되살려 낸다.'
        />
      </Card>

      {invalid ? (
        <StatusBanner icon={<AlertTriangle className='size-4' />} tone='bad'>
          {invalid === 'r0'
            ? `r이 0이 되어 이 k로는 서명할 수 없다. 실제 ECDSA도 이때는 다른 k를 뽑아 다시 서명한다.`
            : `s가 0이 되어 이 k로는 서명할 수 없다. 실제 ECDSA도 이때는 다른 k를 뽑아 다시 서명한다.`}
        </StatusBanner>
      ) : (
        <StatusBanner icon={<PenLine className='size-4' />} tone='good'>
          서명 = (r, s) = ({r}, {s}). 개인키 {d}은 이 두 숫자 어디에도 그대로 들어 있지 않다.
        </StatusBanner>
      )}

      <ExplainCard
        icon={<Dices className='size-4 text-amber-500' />}
        title='k는 어디서 오나'
        preview='난수여야 한다고 배우지만, 요즘 지갑은 난수를 쓰지 않는다.'
        body={
          <>
            <p>
              k가 예측 가능하면 서명식에서 미지수가 하나 사라져 개인키가 바로 풀린다. 그래서 오랫동안 좋은 난수를 뽑는
              게 관건이었고, 난수 생성기가 부실했던 탓에 실제로 자금이 털린 사건이 여러 번 있었다. 마지막 탭에서 그
              계산을 직접 해 본다.
            </p>
            <p className='mt-2'>
              지금 대부분의 비트코인 지갑은 난수를 아예 쓰지 않는다. 개인키와 메시지 해시를 재료로 k를 결정론적으로
              만들어 낸다(RFC 6979). 같은 키로 같은 메시지에 서명하면 언제나 같은 k가 나오지만, 메시지가 다르면 k도
              달라지므로 재사용이 구조적으로 막힌다. 난수의 품질에 목숨을 걸지 않으려고 무작위성을 포기한 셈이다.
            </p>
          </>
        }
      />
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className='flex gap-3 rounded-md border p-3'>
      <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>{n}단계</span>
      <div className='flex flex-col gap-1'>
        <span className='text-sm font-medium tabular-nums'>{title}</span>
        <span className='text-muted-foreground text-xs/relaxed'>{body}</span>
      </div>
    </div>
  );
}
