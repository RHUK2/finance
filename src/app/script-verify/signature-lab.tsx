'use client';

import { useMemo, useState } from 'react';
import { KeyRound, PenLine } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ExplainCard, Field, SectionIntro, SegmentedControl } from '@/components/simulation';
import { Pipeline, type PipeItem } from '@/components/pipeline';
import {
  illustrativeEcdsaSig,
  illustrativePrivKey,
  illustrativePubKey,
  illustrativeSchnorrSig,
  illustrativeSighash,
  illustrativeXOnlyPubKey,
} from '@/lib/script-concept';
import { shortHex } from '@/lib/utils';

type Algo = 'ecdsa' | 'schnorr';

export function SignatureLab() {
  const [message, setMessage] = useState('Alice → Bob : 0.5 BTC');
  const [algo, setAlgo] = useState<Algo>('ecdsa');

  const priv = useMemo(() => illustrativePrivKey('demo'), []);
  const pub = useMemo(() => illustrativePubKey('demo'), []);
  const xOnlyPub = useMemo(() => illustrativeXOnlyPubKey('demo'), []);
  const digest = useMemo(() => illustrativeSighash(message), [message]);

  const ecdsaSig = useMemo(() => illustrativeEcdsaSig(priv, digest), [priv, digest]);
  const schnorrSig = useMemo(() => illustrativeSchnorrSig(priv, digest), [priv, digest]);

  const items: PipeItem[] =
    algo === 'ecdsa'
      ? [
          { kind: 'box', label: '트랜잭션(서명 대상 부분)', value: message },
          { kind: 'op', label: 'SHA-256을 두 번 (SHA-256d)' },
          {
            kind: 'box',
            label: '다이제스트 (32바이트)',
            value: digest,
            tone: 'accent',
          },
          { kind: 'op', label: 'ECDSA 서명 (개인키 + 난수 k)' },
          {
            kind: 'split',
            boxes: [
              { label: 'r (32바이트)', value: ecdsaSig.r },
              { label: 's (32바이트)', value: ecdsaSig.s },
            ],
          },
          {
            kind: 'op',
            label: 'DER 인코딩 + sighash flag 1바이트 덧붙임',
          },
          {
            kind: 'box',
            label: `서명 (약 71~72바이트)`,
            value: `30… ∥ r(${shortHex(ecdsaSig.r)}) ∥ s(${shortHex(ecdsaSig.s)}) ∥ 0x${ecdsaSig.sighashFlag}(SIGHASH_ALL)`,
            tone: 'good',
          },
        ]
      : [
          { kind: 'box', label: '트랜잭션(서명 대상 부분)', value: message },
          { kind: 'op', label: 'SHA-256을 두 번 (SHA-256d)' },
          {
            kind: 'box',
            label: '다이제스트 (32바이트)',
            value: digest,
            tone: 'accent',
          },
          { kind: 'op', label: 'Schnorr 서명 (개인키 + 결정적 난수)' },
          {
            kind: 'box',
            label: '서명 (정확히 64바이트, R ∥ s)',
            value: schnorrSig,
            tone: 'good',
          },
        ];

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='개인키로 메시지에 서명하기'>
        스크립트가 검증하는 건 결국 &#39;이 트랜잭션을 개인키를 가진 사람이 승인했는가&#39;다. 그 증거가 <b>서명</b>
        이다. 트랜잭션(정확히는 그중 서명 대상이 되는 부분)을 해시한 다이제스트에 개인키로 서명을 만든다. 서명 방식은
        주소 타입에 따라 <b>ECDSA</b>(Legacy·SegWit)와 <b>Schnorr</b>(Taproot) 둘로 갈린다.
      </SectionIntro>

      <Card className='flex flex-col gap-4 p-4'>
        <Field label='서명할 메시지 (트랜잭션 요약)'>
          <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder='예: Alice → Bob : 0.5 BTC' />
        </Field>

        <Field label='서명 알고리즘'>
          <SegmentedControl
            options={[
              { value: 'ecdsa', label: 'ECDSA · Legacy/SegWit' },
              { value: 'schnorr', label: 'Schnorr · Taproot' },
            ]}
            value={algo}
            onChange={setAlgo}
          />
        </Field>

        <div className='bg-muted/30 flex flex-col gap-1 rounded-md border p-3 text-xs'>
          <span className='text-muted-foreground flex items-center gap-1.5'>
            <KeyRound className='size-3.5 shrink-0' />
            개인키 (비밀, 서명에만 쓰임)
          </span>
          <code className='font-mono break-all'>{priv}</code>
          <span className='text-muted-foreground mt-1.5 flex items-center gap-1.5'>
            <PenLine className='size-3.5 shrink-0' />
            공개키 (검증자에게 공개)
          </span>
          <code className='font-mono break-all'>
            {algo === 'ecdsa' ? pub : `${xOnlyPub} (x-only, 32바이트 · 부호 비트 없음)`}
          </code>
        </div>
      </Card>

      <Card className='flex flex-col gap-3 p-4'>
        <span className='text-sm font-semibold'>메시지에서 서명까지</span>
        <Pipeline items={items} />
      </Card>

      <ExplainCard
        title='검증자는 개인키 없이 어떻게 서명을 확인할까?'
        preview="검증은 개인키가 아니라 공개키만으로 한다. 이게 서명이 '증거'로 성립하는 이유다."
        body={
          <>
            서명을 만들 때만 개인키가 필요하다. <b>검증</b>은 다이제스트 + 서명(r, s 또는 R‖s) + <b>공개키</b>만으로
            한다. 타원곡선 위에서 서명값과 공개키가 맞아떨어지는지 계산으로 확인할 뿐, 그 계산은 개인키를 몰라도 누구나
            할 수 있다. 그래서 서명은 &#39;개인키를 가진 사람만 만들 수 있지만, 아무나 확인할 수 있는&#39; 비대칭적인
            증거가 된다. 아래 ②·③ 탭에서 이 검증이 스크립트 안에서 정확히 어떤 연산(OP_CHECKSIG)으로 실행되는지 이어서
            본다.
          </>
        }
      />

      <ExplainCard
        title='ECDSA와 Schnorr, 뭐가 다를까?'
        preview='같은 타원곡선(secp256k1) 위에서 동작하지만 서명 모양과 합산 가능 여부가 다르다.'
        body={
          <>
            둘 다 같은 곡선(secp256k1) 위에서 동작하지만 서명의 구조가 다르다. ECDSA 서명은 <b>r, s</b> 두 숫자를 각각
            담아야 해서 가변 길이 DER 인코딩(약 71~72바이트)을 쓴다. Schnorr 서명은{' '}
            <b>R ‖ s를 이어 붙인 정확히 64바이트</b>로 크기가 고정이고 DER 같은 포장이 필요 없어 몇 바이트 더 작다.
            <br />
            <br />더 중요한 차이는 <b>선형성(linearity)</b>이다. Schnorr 서명은 여러 서명을 수학적으로 합쳐 하나로 만들
            수 있다(서명 집계). 이 성질 덕분에 Taproot의 여러 서명자가 참여하는 지출도 겉보기엔 서명 하나짜리 평범한
            지출과 구별되지 않게 만들 수 있다. ECDSA는 이 합산이 안 돼서 항상 서명자 수만큼 서명이 그대로 실려야 한다.
          </>
        }
      />
    </div>
  );
}
