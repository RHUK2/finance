'use client';

import { useState } from 'react';
import { CircleCheck, CircleX, Coins, Send } from 'lucide-react';

import { Panel } from '@/components/panel';
import { Pipeline } from '@/components/pipeline';
import { ControlSlider, ExplainCard, SectionIntro, StatusBanner } from '@/components/simulation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { feeSats, formatSats, txVBytes, type Utxo } from '@/lib/tx-concept';

import { FeeRateControl } from './fee-rate-control';

// 프리셋 지갑. 액면가가 제각각인 동전(UTXO)들. 합계 415,000 sat.
const WALLET: Utxo[] = [
  { id: 1, sats: 200000 },
  { id: 2, sats: 120000 },
  { id: 3, sats: 50000 },
  { id: 4, sats: 30000 },
  { id: 5, sats: 15000 },
];
const WALLET_TOTAL = WALLET.reduce((s, u) => s + u.sats, 0);

export function UtxoModel() {
  const [amount, setAmount] = useState(80000);
  const [feeRate, setFeeRate] = useState<number>(15);
  // 기본 선택은 12만 동전. 설명 카드의 '12만으로 8만을 보내면' 예시와 화면을 맞춘다.
  const [selectedIds, setSelectedIds] = useState<number[]>([2]);

  const selected = WALLET.filter((u) => selectedIds.includes(u.id));
  const inputSum = selected.reduce((s, u) => s + u.sats, 0);
  // 출력 2개(받는 사람 + 잔돈) 가정. 입력 수에 따라 수수료가 달라진다.
  const fee = feeSats(txVBytes('native', selected.length, 2), feeRate);
  const valid = selected.length > 0 && inputSum >= amount + fee;
  const change = valid ? inputSum - amount - fee : 0;
  const shortfall = amount + fee - inputSum;

  const status = valid
    ? { tone: 'good' as const, text: 'text-good', Icon: CircleCheck, label: '유효한 트랜잭션' }
    : { tone: 'bad' as const, text: 'text-bad', Icon: CircleX, label: '유효하지 않은 트랜잭션' };

  function toggleCoin(id: number) {
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
  }

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='UTXO를 고른다 (UTXO 모델)'>
        비트코인 지갑에는 &#39;잔액&#39; 숫자 하나가 있는 게 아니라, 받을 때마다 생긴 <b>UTXO</b>들이 들어 있다.
        송금하려면 UTXO를 골라 통째로 부숴야 해서, 보낼 금액보다 큰 UTXO를 쓰면 나머지가 <b>잔돈</b>으로 내 지갑에
        되돌아온다. 아래에서 <b>UTXO를 직접 클릭해</b> 골라 보자. 고른 UTXO의 합이 송금액 + 수수료를 덮으면 유효한
        트랜잭션이 된다. 수수료는 Native SegWit(bc1q) 주소 기준으로 계산한다. 주소 타입에 따라 얼마나 달라지는지는 주소
        타입별 수수료 탭에서 본다.
      </SectionIntro>

      <Panel>
        <ControlSlider
          icon={<Send className='size-4 text-series-2' />}
          label='보낼 금액'
          value={amount}
          onChange={setAmount}
          min={1000}
          max={WALLET_TOTAL}
          step={1000}
          format={(v) => formatSats(v)}
        />
        <FeeRateControl value={feeRate} onChange={setFeeRate} />

        <div className='flex flex-col gap-1.5 border-t pt-3'>
          <span className='flex items-center gap-1.5 text-sm font-medium'>
            <Coins className='size-4 text-series-1' />내 지갑의 UTXO들 (클릭해서 고르기)
          </span>
          {WALLET.map((u) => {
            const on = selectedIds.includes(u.id);
            return (
              <Button
                key={u.id}
                variant='choice'
                size='card'
                onClick={() => toggleCoin(u.id)}
                aria-pressed={on}
                className={cn('justify-between', on && 'border-series-1/50 aria-pressed:bg-series-1/10')}
              >
                <span className='flex items-center gap-1.5'>
                  <span
                    className={cn(
                      'size-3.5 rounded-full border-2',
                      on ? 'border-series-1 bg-series-1' : 'border-muted-foreground/40',
                    )}
                  />
                  <span className='text-xs text-muted-foreground'>UTXO #{u.id}</span>
                </span>
                <span className='text-sm tabular-nums'>{formatSats(u.sats)}</span>
              </Button>
            );
          })}
        </div>

        {/* 폼 검증 결과: 고른 UTXO가 송금액 + 수수료를 덮는지 */}
        <StatusBanner
          tone={status.tone}
          icon={<status.Icon className={cn('size-4 shrink-0', status.text)} />}
          detail={
            valid
              ? `입력 합계 ${formatSats(inputSum)}가 송금액 + 수수료(${formatSats(amount + fee)})를 덮는다. 남는 ${formatSats(change)}은 잔돈으로 되돌아온다.`
              : selected.length === 0
                ? 'UTXO를 하나도 고르지 않았다. 위에서 UTXO를 클릭해 보자.'
                : `입력 합계가 송금액 + 수수료보다 ${formatSats(shortfall)} 부족하다. UTXO를 더 고르거나 금액을 줄여 보자.`
          }
        >
          {status.label}
        </StatusBanner>
      </Panel>

      <Panel className='gap-3'>
        <span className='text-sm font-semibold'>고른 UTXO가 새 UTXO로</span>
        <Pipeline
          items={[
            {
              kind: 'box',
              label: `입력: 선택된 UTXO ${selected.length}개`,
              value:
                selected.length > 0
                  ? `${selected.map((u) => formatSats(u.sats)).join(' + ')} = ${formatSats(inputSum)}`
                  : '없음',
            },
            { kind: 'op', label: '트랜잭션 (입력을 부수고 출력을 새로 찍음)' },
            {
              kind: 'split',
              boxes: [
                {
                  label: '출력 1 · 받는 사람',
                  value: formatSats(amount),
                  tone: 'series-2',
                },
                {
                  label: '출력 2 · 잔돈(내게 돌아옴)',
                  value: formatSats(change),
                  tone: 'series-1',
                },
              ],
            },
            { kind: 'op', label: '남은 차액 = 채굴자 수수료' },
            { kind: 'box', label: '수수료', value: formatSats(fee) },
          ]}
        />
      </Panel>

      <ExplainCard
        title='왜 항상 잔돈이 생길까?'
        preview='UTXO는 쪼갤 수 없고 통째로만 쓴다. 12만으로 8만을 보내면 잔돈이 돌아온다.'
        body={
          <>
            UTXO는 쪼개 쓸 수 없고 통째로만 쓸 수 있다. 12만 사토시 UTXO로 8만을 보내면, 나머지는 <b>잔돈 출력</b>으로
            새 주소에 되돌려 받는다(그래서 지갑이 매번 새 주소를 만든다). 잔돈을 만들지 않으면 그 차액이 전부 수수료로
            날아가 버린다.
          </>
        }
      />

      <ExplainCard
        title='계좌 모델 vs UTXO 모델'
        preview='은행·이더리움은 잔액을 더하고 빼지만, 비트코인은 현금처럼 UTXO를 주고받는다.'
        body={
          <>
            은행·이더리움은 <b>계좌 잔액</b>을 더하고 빼는 방식이다. 비트코인은 현금 지갑처럼 <b>UTXO 묶음</b>
            이다. 지갑 잔액은 그 UTXO들의 합을 화면에서 계산해 보여줄 뿐이다. 덕분에 어떤 UTXO가 어디서 왔는지 추적이
            쉽고, 여러 입력을 병렬로 검증할 수 있다.
          </>
        }
      />
    </div>
  );
}
