'use client';

import { useState } from 'react';

import { Card } from '@/components/ui/card';
import { ExplainCard, Legend, SectionIntro, SegmentedControl } from '@/components/simulation';
import { cn } from '@/lib/utils';

type Mode = 'legacy' | 'segwit';

// 필드 한 칸. role별로 색을 달리해 잠금/해제를 구분한다. witness도 해제 열쇠이므로 scriptSig와 같은 색.
type Role = 'plain' | 'lock' | 'unlock';

const ROLE_CLASS: Record<Role, string> = {
  plain: 'bg-muted',
  lock: 'border border-amber-500/40 bg-amber-500/5',
  unlock: 'border border-emerald-500/40 bg-emerald-500/5',
};

function FieldBox({ name, desc, role = 'plain' }: { name: string; desc: string; role?: Role }) {
  return (
    <div className={cn('flex flex-col gap-0.5 rounded-md p-2.5', ROLE_CLASS[role])}>
      <code className='font-mono text-xs font-semibold'>{name}</code>
      <span className='text-muted-foreground text-[11px] leading-snug'>{desc}</span>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className='rounded-md border border-dashed p-2.5'>
      <span className='text-muted-foreground mb-2 block text-xs font-medium'>{title}</span>
      <div className='flex flex-col gap-1.5'>{children}</div>
    </div>
  );
}

export function TxStructure() {
  const [mode, setMode] = useState<Mode>('segwit');
  const isSegwit = mode === 'segwit';

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='트랜잭션은 이런 필드로 되어 있다'>
        트랜잭션은 하나의 데이터 묶음이다. 크게 <b>버전 · 입력 목록 · 출력 목록 · 락타임</b>으로 이뤄지고, 입력·출력
        안에는 다시 정해진 필드가 들어간다. 뒤 탭의 &lsquo;크기&rsquo;는 이 필드들의 바이트를 센 것이고, 스크립트·서명
        검증 페이지의 &lsquo;검증&rsquo;은 이 안의 스크립트를 실행하는 것이다. 먼저 뼈대부터 보자.
      </SectionIntro>

      <Card className='flex flex-col gap-4 p-4'>
        <div className='flex flex-col gap-2'>
          <span className='text-sm font-semibold'>서명이 어디에 담기나</span>
          <SegmentedControl<Mode>
            options={[
              { value: 'legacy', label: 'Legacy (서명 = scriptSig)' },
              { value: 'segwit', label: 'SegWit (서명 = witness)' },
            ]}
            value={mode}
            onChange={setMode}
          />
        </div>

        <div className='flex flex-col gap-1.5'>
          <FieldBox name='version' desc='트랜잭션 규칙 버전 (4바이트)' />

          <Group title='입력 (쓸 동전 하나마다 반복)'>
            <FieldBox name='txid + vout' desc='어느 이전 출력(UTXO)을 쓰는지 가리킴' />
            <FieldBox
              name='scriptSig'
              desc={
                isSegwit
                  ? '해제 스크립트. SegWit에선 비어 있음 (서명이 아래 witness로 이동)'
                  : '해제 스크립트. 여기에 서명·공개키가 통째로 들어감'
              }
              role={isSegwit ? 'plain' : 'unlock'}
            />
            <FieldBox name='sequence' desc='상대 락타임 등 (4바이트)' />
          </Group>

          <Group title='출력 (받는 사람 + 잔돈마다 반복)'>
            <FieldBox name='value' desc='보내는 금액 (사토시, 8바이트)' />
            <FieldBox name='scriptPubKey' desc='잠금 스크립트. 이 돈을 풀려면 뭐가 필요한지의 조건' role='lock' />
          </Group>

          {isSegwit && (
            <Group title='witness (SegWit에서 추가되는 영역)'>
              <FieldBox
                name='서명 + 공개키'
                desc='입력을 푸는 서명 뭉치. scriptSig 대신 여기 담기고, 크기가 1/4로 계산됨'
                role='unlock'
              />
            </Group>
          )}

          <FieldBox name='locktime' desc='이 시점 전엔 확정 불가 (4바이트)' />
        </div>

        <div className='text-muted-foreground flex flex-wrap gap-x-4 gap-y-1.5 text-xs'>
          <Legend className='bg-amber-500/60' label='잠금 (scriptPubKey)' />
          <Legend className='bg-emerald-500/60' label='해제 (scriptSig · witness)' />
        </div>
      </Card>

      <ExplainCard
        title='잠금과 해제: 출력이 걸고, 입력이 푼다'
        preview='출력의 scriptPubKey가 자물쇠, 그걸 쓰는 입력의 scriptSig·witness가 열쇠다.'
        body={
          <>
            돈은 <b>출력</b>에 담긴다. 출력의 <b>scriptPubKey</b>는 &lsquo;이 돈을 쓰려면 이 조건을 만족해라&rsquo;라는
            자물쇠다. 나중에 그 돈을 쓰려면, 새 트랜잭션이 그 출력을 <b>입력</b>으로 가리키고(txid + vout), 자물쇠를
            푸는 열쇠(서명·공개키)를 내놓아야 한다.
            <br />
            <br />이 열쇠가 담기는 자리가 위 토글의 차이다. Legacy는 열쇠를 <b>scriptSig</b>에 넣고, SegWit은 별도{' '}
            <b>witness</b> 영역으로 뺀다. 하는 일은 같은데 담는 자리만 다르다. 이 &lsquo;자리 차이&rsquo;가 다음 탭의
            크기 차이와 SegWit 할인으로, 스크립트·서명 검증 페이지의 검증으로 이어진다.
          </>
        }
      />
    </div>
  );
}
