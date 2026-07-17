'use client';

import { useState } from 'react';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ExplainCard, Field, SectionIntro } from '@/components/simulation';
import { cn } from '@/lib/utils';
import { ADDR_TYPES, feeSats, formatSats, txVBytes } from '@/lib/tx-concept';

import { FeeRateControl } from './fee-rate-control';

export function AddressCompare() {
  const [numIn, setNumIn] = useState(2);
  const [numOut, setNumOut] = useState(2);
  const [feeRate, setFeeRate] = useState(15);

  const legacyVb = txVBytes('legacy', numIn, numOut);
  const legacyFee = feeSats(legacyVb, feeRate);

  const rows = ADDR_TYPES.map((t) => {
    const vb = txVBytes(t.value, numIn, numOut);
    const fee = feeSats(vb, feeRate);
    return {
      ...t,
      vb,
      fee,
      saving: t.value === 'legacy' ? 0 : 1 - fee / legacyFee,
      width: (vb / legacyVb) * 100,
    };
  });

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='주소 타입이 수수료를 좌우한다'>
        같은 송금(같은 입력·출력 개수)이라도 주소 타입에 따라 트랜잭션 크기가 달라 수수료가 달라진다. 지갑 키 생성에서
        고른 purpose(44&apos;/49&apos;/84&apos;/86&apos;)가 결국 이 차이로 이어진다. 입력·출력 개수를 바꿔 절감 폭을
        비교해 보자.
      </SectionIntro>

      <Card className='flex flex-col gap-4 p-4'>
        <div className='grid grid-cols-2 gap-4'>
          <Field label='입력 개수'>
            <Input
              type='number'
              min={1}
              value={numIn}
              onChange={(e) => setNumIn(Math.max(1, Number(e.target.value) || 1))}
            />
          </Field>
          <Field label='출력 개수'>
            <Input
              type='number'
              min={1}
              value={numOut}
              onChange={(e) => setNumOut(Math.max(1, Number(e.target.value) || 1))}
            />
          </Field>
        </div>

        <div className='border-t pt-3'>
          <FeeRateControl value={feeRate} onChange={setFeeRate} />
        </div>
      </Card>

      <Card className='flex flex-col gap-3 p-4'>
        <span className='text-sm font-semibold'>타입별 크기·수수료 (Legacy 기준 비교)</span>
        <div className='flex flex-col gap-3'>
          {rows.map((r) => (
            <div key={r.value} className='flex flex-col gap-1'>
              <div className='flex items-baseline justify-between text-sm'>
                <span className='font-medium'>
                  <span className='text-muted-foreground font-mono text-xs'>{r.purpose} </span>
                  {r.label}
                </span>
                <span className='text-muted-foreground text-xs tabular-nums'>{r.vb} vB</span>
              </div>
              <div className='bg-muted h-7 w-full overflow-hidden rounded-md'>
                <div
                  className={cn(
                    'flex h-full items-center justify-end rounded-md px-2 transition-all',
                    r.value === 'legacy' ? 'bg-muted-foreground/40' : 'bg-primary',
                  )}
                  style={{ width: `${r.width}%` }}
                >
                  <span className='text-primary-foreground text-xs tabular-nums'>{formatSats(r.fee)}</span>
                </div>
              </div>
              <span className='text-muted-foreground text-xs'>
                {r.value === 'legacy' ? '기준 (가장 큼)' : `Legacy 대비 ${(r.saving * 100).toFixed(0)}% 절감`}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <ExplainCard
        title='Taproot이 항상 싼 건 아니다 (입력이 많아야 이긴다)'
        preview='Taproot은 입력이 가장 작지만 출력이 가장 크다. 그래서 입력 개수에 따라 순위가 뒤집힌다.'
        body={
          <>
            ③ 탭에서 본 <b>witness 할인</b>이 여기서 타입별 차이로 나타난다. 서명이 witness로 빠진 SegWit·Taproot 입력은
            Legacy보다 훨씬 작다.
            <br />
            <br />
            그런데 위 막대를 보면 기본값(입력 2·출력 2)에서 Taproot(211.5 vB)이 Native SegWit(208.5 vB)보다{' '}
            <b>오히려 크다</b>. Taproot은 입력이 가장 작지만(57.5 vB, SegWit은 68 vB) <b>출력이 가장 크기</b>{' '}
            때문이다(43 vB, SegWit은 31 vB). 주소에 20바이트 해시 대신 32바이트 공개키를 그대로 담아서다.
            <br />
            <br />
            그래서 순위가 <b>입력 개수에 따라 뒤집힌다</b>. 입력이 늘수록 입력 쪽 이득이 출력 쪽 손해를 넘어선다. 위
            입력 개수를 3으로 올려 보면 Taproot이 Native SegWit을 앞지르고, 5로 올리면 격차가 더 벌어진다.
          </>
        }
      />
    </div>
  );
}
