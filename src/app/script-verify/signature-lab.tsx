'use client';

import { useMemo, useState } from 'react';
import { Eye, Lock } from 'lucide-react';

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
          { kind: 'op', label: 'ECDSA 서명(다이제스트, 개인키, 난수 k)' },
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
          { kind: 'op', label: 'Schnorr 서명(다이제스트, 개인키, 결정적 난수)' },
          {
            kind: 'box',
            label: '서명 (64바이트)',
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
            <Lock className='size-3.5 shrink-0 text-amber-600 dark:text-amber-400' />
            개인키 (비밀, 서명에만 쓰임)
          </span>
          <code className='font-mono break-all'>{priv}</code>
          <span className='text-muted-foreground mt-1.5 flex items-center gap-1.5'>
            <Eye className='size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400' />
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
        title='키 생성 · 서명 · 검증은 서로 다른 동작이다'
        preview='개인키로 공개키를 만드는 건 딱 한 번, 서명은 트랜잭션마다, 검증은 개인키 없이. 셋을 헷갈리기 쉽다.'
        body={
          <>
            개인키 하나에서 <b>공개키</b>를 뽑는 건 <b>키 생성</b>이다. 개인키에 곡선의 곱셈을 한 번 적용하면 끝이고,
            메시지와는 아무 상관이 없다. 주소를 만들 때 한 번 해두면 계속 재사용한다.
            <br />
            <br />
            <b>서명</b>은 여기에 <b>다이제스트(메시지)와 난수</b>를 더해 (r, s)를 만드는 별개의 계산이다. 개인키가
            들어가는 건 같지만 트랜잭션마다 매번 새로 하고 결과도 매번 다르다. 위 파이프라인이 바로 이 단계다.
            <br />
            <br />
            <b>검증</b>은 이 둘과 또 다른 동작으로, 개인키 없이 <b>공개키</b>만으로 한다. 그 원리는 이어지는 설명에서,
            실제로 스크립트가 어떻게 실행하는지는 ② 스크립트 실행 탭에서 이어서 본다.
            <br />
            <br />
            정리하면 개인키→공개키는 &#39;신분증 만들기&#39;(한 번), 서명은 &#39;이 메시지에 도장 찍기&#39;(매번),
            검증은 &#39;그 도장이 진짜인지 대조&#39;(공개키만)다. 셋 다 같은 secp256k1 곡선 위에서 일어나지만 목적과
            입력이 다르다.
          </>
        }
      />

      <ExplainCard
        title='검증자는 개인키 없이 어떻게 서명을 확인할까?'
        preview="검증은 개인키가 아니라 공개키만으로 한다. 이게 서명이 '증거'로 성립하는 이유다."
        body={
          <>
            서명을 만들 때만 개인키가 필요하다. <b>검증</b>은 다이제스트 + 서명(r, s 또는 R‖s) + <b>공개키</b>만으로
            한다. 타원곡선 위에서 서명값과 공개키가 맞아떨어지는지 계산으로 확인할 뿐, 그 계산은 개인키를 몰라도 누구나
            할 수 있다. 그래서 서명은 &#39;개인키를 가진 사람만 만들 수 있지만, 아무나 확인할 수 있는&#39; 비대칭적인
            증거가 된다. 이 검증이 스크립트 안에서 정확히 어떤 연산(OP_CHECKSIG)으로 실행되는지는 ② 스크립트 실행·③ 주소
            타입별 비교 탭에서 이어서 본다.
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
