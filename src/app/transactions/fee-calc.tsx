'use client';

import { useState } from 'react';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pipeline } from '@/components/pipeline';
import { ExplainCard, Field, SectionIntro } from '@/components/simulation';

import { FeeRateControl } from './fee-rate-control';
import {
  addrMeta,
  ADDR_TYPES,
  type AddrType,
  feeSats,
  formatSats,
  satsToBtc,
  TX_OVERHEAD_VB,
  txVBytes,
} from '@/lib/tx-concept';

export function FeeCalc() {
  const [type, setType] = useState<AddrType>('native');
  const [numIn, setNumIn] = useState(2);
  const [numOut, setNumOut] = useState(2);
  const [feeRate, setFeeRate] = useState(15);

  const meta = addrMeta(type);
  const vbytes = txVBytes(type, numIn, numOut);
  const fee = feeSats(vbytes, feeRate);

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='크기가 수수료다 (vByte × sat/vB)'>
        수수료는 <b>보내는 금액과 아무 상관이 없다</b>. 트랜잭션이 블록에서 차지하는 공간, 즉 <b>vByte 크기</b>에만
        매겨진다. 입력이 많을수록(동전을 여러 개 쓸수록) 커지고, 그만큼 비싸진다. 입력·출력 개수와 수수료율을 바꿔 보자.
      </SectionIntro>

      <Card className='flex flex-col gap-4 p-4'>
        <div className='grid grid-cols-2 gap-4 sm:grid-cols-3'>
          <Field label='입력 개수 (쓸 동전 수)'>
            <Input
              type='number'
              min={1}
              value={numIn}
              onChange={(e) => setNumIn(Math.max(1, Number(e.target.value) || 1))}
            />
          </Field>
          <Field label='출력 개수 (받는 사람+잔돈)'>
            <Input
              type='number'
              min={1}
              value={numOut}
              onChange={(e) => setNumOut(Math.max(1, Number(e.target.value) || 1))}
            />
          </Field>
          <Field label='주소 타입'>
            <Select value={type} onValueChange={(v) => setType(v as AddrType)}>
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ADDR_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className='border-t pt-3'>
          <FeeRateControl value={feeRate} onChange={setFeeRate} />
        </div>
      </Card>

      <Card className='flex flex-col gap-3 p-4'>
        <span className='text-sm font-semibold'>크기가 수수료가 되기까지</span>
        <Pipeline
          items={[
            {
              kind: 'box',
              label: '트랜잭션 크기 (vByte)',
              value: `오버헤드 ${TX_OVERHEAD_VB} + 입력 ${numIn}×${meta.inputVb} + 출력 ${numOut}×${meta.outputVb}`,
            },
            { kind: 'op', label: '합산' },
            {
              kind: 'box',
              label: '총 크기',
              value: `${vbytes} vByte`,
              tone: 'accent',
            },
            { kind: 'op', label: `× 수수료율 ${feeRate} sat/vB` },
            {
              kind: 'box',
              label: '수수료',
              value: `${formatSats(fee)} · ${satsToBtc(fee)} BTC`,
              tone: 'good',
            },
          ]}
        />
      </Card>

      <ExplainCard
        title='수수료는 금액이 아니라 크기에 붙는다 (블록 공간 경매)'
        preview='한 블록의 공간은 약 4백만 weight로 고정돼 있어, 자리를 두고 벌이는 경매다.'
        body={
          <>
            한 블록(약 10분에 하나)에 들어갈 공간은 약 4백만 weight(≈ 1MvB)로 한정된다. 채굴자는{' '}
            <b>vByte당 수수료가 높은</b> 트랜잭션부터 담는다. 그래서 0.001 BTC를 보내든 100 BTC를 보내든, 크기가 같으면
            수수료도 같다. 멤풀이 붐비면 sat/vB 입찰가가 올라간다.
          </>
        }
      />

      <ExplainCard
        title='SegWit 할인: witness는 1/4만 센다'
        preview='블록은 바이트가 아니라 weight로 재고, 서명은 1/4 가중치만 차지해서 더 싸다.'
        body={
          <>
            블록 크기는 바이트가 아니라 <b>weight unit</b>으로 잰다. 일반 데이터는 4 wu, 서명(witness) 데이터는 1 wu다.
            vByte = weight ÷ 4이므로, 서명이 witness로 빠진 SegWit·Taproot 입력은 같은 일을 하면서도 vByte가
            작아진다(예: Legacy 입력 148 vB → Native SegWit 68 vB). 다음 탭에서 타입별 차이를 직접 비교해 보자.
          </>
        }
      />

      <ExplainCard
        title='10.5 · 68 · 31은 어디서 나온 숫자일까?'
        preview='실제 바이트를 센 값이다. 오버헤드의 0.5는 witness 할인이 만든 소수점이다.'
        body={
          <>
            위 파이프라인의 세 숫자는 어림잡은 게 아니라 실제 바이트를 센 값이다. weight로 재서 4로 나누기 때문에
            소수점이 생긴다.
            <div className='bg-muted/50 my-3 overflow-x-auto rounded-md p-3'>
              <pre className='font-mono text-[11px] leading-relaxed'>{`오버헤드 10.5 vB  (트랜잭션마다 한 번)
  비witness  version 4 + 입력수 1 + 출력수 1 + locktime 4 = 10 B → 40 wu
  witness    marker 1 + flag 1                          =  2 B →  2 wu
  합계       42 wu ÷ 4 = 10.5 vB

입력 68 vB  (Native SegWit, 입력 1개당)
  비witness  txid 32 + vout 4 + scriptSig 길이 1 + sequence 4 = 41 B → 164 wu
  witness    서명 72 + 공개키 33 + 길이 표시 3              = 108 B → 108 wu
  합계       272 wu ÷ 4 = 68 vB

출력 31 vB  (출력 1개당)
  비witness  value 8 + script 길이 1 + OP_0·push20·해시 20 = 31 B → 124 wu
  합계       124 wu ÷ 4 = 31 vB`}</pre>
            </div>
            오버헤드에 <b>0.5</b>가 붙는 건 SegWit 표시용 marker·flag 2바이트가 witness라 1/4로 계산되기 때문이다(2 ÷ 4
            = 0.5).
            <br />
            <br />
            입력을 보면 할인이 어디서 오는지 드러난다. 서명 72바이트와 공개키 33바이트가 witness에 있어 1 wu로 세어진다.
            Legacy 입력이 <b>148 vB</b>인 건 구성 요소가 거의 같은데 이 서명 뭉치가 scriptSig에 들어가 할인 없이 4 wu로
            세어지기 때문이다.
            <br />
            <br />
            출력에는 서명이 없어 할인받을 게 없다. 그래서 바이트 수가 그대로 vByte가 된다. 다음 탭에서 Taproot 출력이 43
            vB로 가장 큰 것도 여기에 이유가 있다. 20바이트 해시 대신 32바이트 공개키가 들어가는데, 할인이 없으니 늘어난
            12 바이트가 고스란히 12 vB로 붙는다.
          </>
        }
      />
    </div>
  );
}
