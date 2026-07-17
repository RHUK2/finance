'use client';

import { useState } from 'react';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pipeline } from '@/components/pipeline';
import { ExplainCard, Field, SectionIntro } from '@/components/simulation';

import { FeeRateControl } from './fee-rate-control';
import { addrMeta, ADDR_TYPES, type AddrType, feeSats, formatSats, TX_OVERHEAD_VB, txVBytes } from '@/lib/tx-concept';

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
              value: formatSats(fee),
              tone: 'good',
            },
          ]}
        />
      </Card>

      <ExplainCard
        title='수수료는 금액이 아니라 크기에 붙는다 (블록 공간 경매)'
        preview='블록은 크기가 정해진 상자다. 자리를 두고 vByte당 수수료로 입찰하는 경매가 벌어진다.'
        body={
          <>
            블록을 <b>크기가 정해진 상자</b>라고 보자. 약 10분마다 하나씩 생기고, 담을 수 있는 용량은 약 <b>1MvB</b>로
            고정돼 있다. 이 상자에 실리려는 트랜잭션은 많고 자리는 한정돼 있으니, 자연스레 경매가 된다.
            <br />
            <br />
            채굴자는 상자에 담을 때 <b>vByte당 수수료(sat/vB)가 높은</b> 트랜잭션부터 골라 담는다. 여기서 기준은{' '}
            &lsquo;총액&rsquo;이 아니라 &lsquo;단위 크기당 값&rsquo;이다. 자리는 크기로 재니까, 같은 자리라면 더 비싸게
            부른 쪽이 먼저 실린다.
            <br />
            <br />
            그래서 0.001 BTC를 보내든 100 BTC를 보내든, 트랜잭션 크기가 같으면 수수료도 같다. 금액은 상자 자리를 더
            차지하지 않기 때문이다. 반대로 멤풀에 트랜잭션이 몰리면 자리 경쟁이 세져 sat/vB 입찰가가 올라간다.
          </>
        }
      />

      <ExplainCard
        title='SegWit 할인: 서명만 1/4로 센다'
        preview='서명은 블록 한도에 1/4만 계산된다. 물리적 크기는 그대로고, 계산되는 크기만 준다.'
        body={
          <>
            규칙은 딱 한 줄이다: <b>서명(witness) 데이터는 블록 한도에 1/4만 계산한다</b>. 나머지(입력·출력의 일반
            필드)는 바이트 그대로다.
            <br />
            <br />
            헷갈리는 지점부터 짚자. 여기서 &lsquo;크기&rsquo;는 두 가지다.
            <div className='bg-muted/50 my-3 overflow-x-auto rounded-md p-3'>
              <pre className='font-mono text-[11px] leading-relaxed'>{`실제 전송·저장하는 크기   서명 100바이트 = 100바이트 (그대로)
블록 한도에 계산되는 크기  서명 100바이트 =  25바이트 (1/4)`}</pre>
            </div>
            서명은 네트워크로 100바이트를 그대로 보낸다. 줄어드는 건 물리적 크기가 아니라, 한 블록(약 1MvB)의 자리를
            두고 벌이는 경매에서 <b>얼마를 차지한 걸로 칠지</b>다. 수수료는 이 &lsquo;계산되는 크기&rsquo;에 붙으므로,
            서명이 무거운 트랜잭션일수록 할인폭이 커진다.
            <br />
            <br />왜 하필 서명만 깎아줄까. 자원 비용이 다르기 때문이다. <b>출력(UTXO)</b>은 모든 노드가 영원히 메모리에
            들고 있어야 하는 비싼 자원이라 할인이 없다. 반면 <b>서명</b>은 검증이 끝나면 버려도 되는(가지치기 가능) 싼
            자원이라 1/4만 매긴다. 임의의 숫자가 아니라 자원 비용에 맞춘 가격이다.
            <br />
            <br />
            같은 송금인데 Legacy 입력이 <b>148 vB</b>, Native SegWit이 <b>68 vB</b>인 이유가 이거다. ② 탭에서 봤듯
            서명을 넣는 자리만 다르다. Legacy는 서명을 일반 영역(scriptSig)에 넣어 제값을 다 내고, SegWit은 witness로
            빼서 1/4만 낸다. 다음 탭에서 타입별 차이를 직접 비교해 보자.
            <br />
            <br />
            <span className='text-muted-foreground text-[11px]'>
              참고: 계산 단위는 원래 weight(일반 1바이트 = 4, 서명 1바이트 = 1)로 세고, vByte = weight ÷ 4다. 서명이
              1/4로 접히는 걸 정수 산수로 떨어뜨리기 위한 회계 단위일 뿐이다.
            </span>
          </>
        }
      />
    </div>
  );
}
