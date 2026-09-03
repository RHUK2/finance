'use client';

import { useMemo, useState } from 'react';

import Link from 'next/link';

import { History, Search, Unlock } from 'lucide-react';

import { cn } from '@/lib/utils';

import { ControlSlider, ExplainCard, Metric, SectionIntro, StatusBanner } from '@/components/simulation';
import { Card } from '@/components/ui/card';

import { MULTIPLES_OF_G, N, bruteForce, fmtPt, inv, mod, recoverFromReuse, sign } from './models';

export function BreakLab({ d, z, k }: { d: number; z: number; k: number }) {
  // z와 다르기만 하면 공격이 성립한다. 다만 슬라이더가 양 끝에 붙어 시작하면 만질 수
  // 있는 값처럼 보이지 않으므로 가운데 쪽으로 떨어지는 오프셋을 쓴다.
  const [z2, setZ2] = useState(() => mod(z + 5, N));

  const Q = MULTIPLES_OF_G[d];
  const found = useMemo(() => bruteForce(Q), [Q]);

  const sig1 = useMemo(() => sign(d, z, k), [d, z, k]);
  const sig2 = useMemo(() => sign(d, z2, k), [d, z2, k]);
  const recovered = useMemo(() => recoverFromReuse(z, sig1.s, z2, sig2.s, sig1.r), [z, sig1.s, z2, sig2.s, sig1.r]);
  const sameZ = mod(z, N) === mod(z2, N);

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='크기가 곧 안전이다'>
        ECDSA의 안전은 이산로그가 어렵다는 가정 하나에 전부 걸려 있다. 그런데 이 곡선에서는 그 가정이 성립하지 않는다.
        개인키 후보가 {N - 1}개뿐이라 전부 시도하면 끝나기 때문이다. 공개키만 주고 개인키를 찾아보자.
      </SectionIntro>

      <Card className='flex flex-col gap-3 p-4'>
        <span className='flex items-center gap-1.5 text-sm font-semibold'>
          <Search className='size-4 text-rose-500' />
          공개키 {fmtPt(Q)}에서 개인키 찾기
        </span>
        <div className='grid grid-cols-3 gap-1.5 text-xs sm:grid-cols-5 lg:grid-cols-6'>
          {Array.from({ length: N - 1 }, (_, i) => i + 1).map((cand) => (
            <div
              key={cand}
              className={cn(
                'flex items-center justify-between rounded-md border px-2 py-1 tabular-nums',
                cand === found ? 'border-rose-500/60 bg-rose-500/15' : 'text-muted-foreground',
              )}
            >
              <span>{cand}G</span>
              <span>{fmtPt(MULTIPLES_OF_G[cand])}</span>
            </div>
          ))}
        </div>
        <StatusBanner icon={<Unlock className='size-4' />} tone='bad'>
          {found}번째 후보에서 걸렸다. 개인키는 {found}이다.
        </StatusBanner>
        <p className='text-muted-foreground text-xs/relaxed'>
          secp256k1에서 이 표는 약 1.158 × 10⁷⁷줄이 된다. 1초에 10억 줄씩 훑는 기계를 지구상의 모든 원자만큼 모아 우주의
          나이만큼 돌려도 끝나지 않는다. 알고리즘은 이 페이지와 한 글자도 다르지 않고 오직 이 표의 길이만 다르다.
        </p>
      </Card>

      <SectionIntro title='그런데 표를 아무리 길게 해도 막지 못하는 실수가 있다'>
        일회용 비밀값 k를 두 번 쓰면 곡선의 크기와 무관하게 개인키가 나온다. 훑어보는 게 아니라 방정식을 푸는 것이라
        후보 개수가 상관없다. 아래에서 같은 k로 서로 다른 두 메시지에 서명해 보자.
      </SectionIntro>

      <Card className='gap-4 p-4'>
        <ControlSlider
          label='두 번째 메시지 해시 z₂'
          hint={`첫 번째는 서명 만들기 탭에서 고른 z = ${z}다. 개인키 d = ${d}와 일회용 비밀값 k = ${k}는 두 서명이 똑같이 쓴다.`}
          value={z2}
          onChange={setZ2}
          min={0}
          max={N - 1}
          step={1}
          format={(v) => `${v}`}
        />
        <div className='grid grid-cols-2 gap-3'>
          <Metric label='서명 1' value={`(${sig1.r}, ${sig1.s})`} sub={`z₁ = ${z}`} />
          <Metric label='서명 2' value={`(${sig2.r}, ${sig2.s})`} sub={`z₂ = ${z2}`} />
        </div>
        <StatusBanner icon={<Search className='size-4' />} tone='accent'>
          두 서명의 r이 {sig1.r}로 같다. k를 다시 썼다는 사실이 서명만 보고도 드러난다.
        </StatusBanner>
      </Card>

      {sameZ ? (
        <StatusBanner icon={<Search className='size-4' />}>
          두 메시지 해시가 같으면 서명도 같아서 새로 얻는 정보가 없다. z₂를 다른 값으로 옮겨 보자.
        </StatusBanner>
      ) : (
        recovered && (
          <Card className='flex flex-col gap-2 p-4'>
            <span className='flex items-center gap-1.5 text-sm font-semibold'>
              <Unlock className='size-4 text-rose-500' />두 식에서 미지수를 지운다
            </span>
            <Line
              label='s₁ − s₂ = k⁻¹(z₁ − z₂)'
              value={`${sig1.s} − ${sig2.s} ≡ ${mod(sig1.s - sig2.s, N)}, ${z} − ${z2} ≡ ${mod(z - z2, N)}`}
              note='두 식을 빼면 개인키 d가 사라진다. 남은 미지수는 k 하나뿐이다.'
            />
            <Line
              label='k = (z₁ − z₂)(s₁ − s₂)⁻¹ mod n'
              value={`${mod(z - z2, N)} × ${inv(mod(sig1.s - sig2.s, N), N)} mod ${N} = ${recovered.k}`}
              note={`실제로 쓴 k는 ${k}였다.`}
            />
            <Line
              label='d = (s₁·k − z₁)·r⁻¹ mod n'
              value={`(${sig1.s} × ${recovered.k} − ${z}) × ${inv(sig1.r, N)} mod ${N} = ${recovered.d}`}
              note={`k를 서명식에 되넣으면 개인키가 떨어진다. 실제 개인키는 ${d}였다.`}
            />
            <StatusBanner icon={<Unlock className='size-4' />} tone='bad'>
              개인키 {recovered.d}을 되찾았다. 곡선을 아무리 키워도 이 계산은 그대로 성립한다.
            </StatusBanner>
          </Card>
        )
      )}

      <Card className='flex flex-col gap-2 p-4'>
        <span className='flex items-center gap-1.5 text-sm font-semibold'>
          <History className='size-4 text-amber-500' />
          실제로 두 번 일어났다
        </span>
        <p className='text-muted-foreground text-sm/relaxed'>
          2010년, 소니 플레이스테이션 3의 펌웨어 서명에서 k가 상수로 박혀 있는 것이 발견됐다. 서명 두 개만 모으면 위의
          계산으로 서명키가 나왔고, 누구나 정품으로 인식되는 소프트웨어를 만들 수 있게 됐다.
        </p>
        <p className='text-muted-foreground text-sm/relaxed'>
          2013년에는 안드로이드의 난수 생성기 결함으로 여러 비트코인 지갑이 서로 다른 트랜잭션에 같은 k를 썼다. 공개
          원장에서 r이 같은 서명 쌍을 찾기만 하면 됐고, 그 주소의 코인이 털렸다. 원장이 공개라는 성질이 여기서는 공격자
          편에 섰다.
        </p>
        <p className='text-muted-foreground text-sm/relaxed'>
          십 년 사이 서로 무관한 두 조직이 같은 실수를 했다. 그래서 지금 지갑들은 k를 난수로 뽑지 않고 개인키와 메시지
          해시에서 결정론적으로 만들어 낸다(RFC 6979). 난수의 품질에 안전을 걸지 않기로 한 것이다.
        </p>
      </Card>

      <ExplainCard
        icon={<Unlock className='size-4 text-violet-500' />}
        title='그럼 양자컴퓨터는'
        preview='이산로그는 쇼어 알고리즘이 푸는 문제라, 크기를 키우는 방어가 통하지 않는다.'
        body={
          <>
            <p>
              이 탭의 전수 대입은 후보를 하나씩 훑는 방식이라 곡선을 키우면 막힌다. 그런데 이산로그 자체를 훑지 않고
              푸는 방법이 이론적으로 알려져 있다. 쇼어 알고리즘이며, 충분한 규모의 양자컴퓨터가 있어야 돌아간다. 그것이
              나오면 공개키만으로 개인키를 얻게 되므로 곡선을 키우는 방어가 통하지 않는다.
            </p>
            <p className='mt-2'>
              비트코인에서 그게 어떤 조건에서 문제가 되는지는{' '}
              <Link href='/bitcoin-quantum' className='underline underline-offset-2'>
                비트코인 양자컴퓨터
              </Link>{' '}
              페이지에서 따로 다룬다. 여기서 짚을 것은 하나다. 이 페이지가 보여 준 안전은 이산로그가 어렵다는 가정 위에
              서 있고, 가정은 가정이다.
            </p>
          </>
        }
      />
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
