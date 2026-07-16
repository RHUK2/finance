'use client';

import { useState } from 'react';
import { CircleCheck, CircleX, Coins, Send } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Pipeline } from '@/components/pipeline';
import { ControlSlider, ExplainCard, SectionIntro } from '@/components/simulation';
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
    ? {
        box: 'border-emerald-500/40 bg-emerald-500/5',
        text: 'text-emerald-600 dark:text-emerald-400',
        Icon: CircleCheck,
        label: '유효한 트랜잭션',
      }
    : {
        box: 'border-rose-500/40 bg-rose-500/5',
        text: 'text-rose-600 dark:text-rose-400',
        Icon: CircleX,
        label: '유효하지 않은 트랜잭션',
      };

  function toggleCoin(id: number) {
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
  }

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='동전을 고른다 (UTXO 모델)'>
        비트코인 지갑에는 &#39;잔액&#39; 숫자 하나가 있는 게 아니라, 받을 때마다 생긴 <b>동전(UTXO)</b>들이 들어 있다.
        송금하려면 동전을 골라 통째로 부숴야 해서, 보낼 금액보다 큰 동전을 쓰면 나머지가 <b>잔돈</b>으로 내 지갑에
        되돌아온다. 아래에서 <b>동전을 직접 클릭해</b> 골라 보자. 고른 동전의 합이 송금액 + 수수료를 덮으면 유효한
        트랜잭션이 된다.
      </SectionIntro>

      <Card className='flex flex-col gap-4 p-4'>
        <ControlSlider
          icon={<Send className='size-4 text-emerald-600 dark:text-emerald-400' />}
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
            <Coins className='size-4 text-amber-600 dark:text-amber-400' />내 지갑의 동전들 (클릭해서 고르기)
          </span>
          {WALLET.map((u) => {
            const on = selectedIds.includes(u.id);
            return (
              <button
                key={u.id}
                onClick={() => toggleCoin(u.id)}
                aria-pressed={on}
                className={cn(
                  'flex items-center justify-between rounded-md border px-3 py-2 text-left transition-colors',
                  on ? 'border-amber-500/50 bg-amber-500/10' : 'bg-muted hover:border-border border-transparent',
                )}
              >
                <span className='flex items-center gap-1.5'>
                  <span
                    className={cn(
                      'size-3.5 rounded-full border-2',
                      on ? 'border-amber-500 bg-amber-500' : 'border-muted-foreground/40',
                    )}
                  />
                  <span className='text-muted-foreground text-xs'>동전 #{u.id}</span>
                </span>
                <span className='text-sm tabular-nums'>{formatSats(u.sats)}</span>
              </button>
            );
          })}
        </div>

        {/* 폼 검증 결과: 고른 동전이 송금액 + 수수료를 덮는지 */}
        <div className={cn('flex flex-col gap-1 rounded-md border p-3 text-sm', status.box)}>
          <span className={cn('flex items-center gap-1.5 font-semibold', status.text)}>
            <status.Icon className='size-4 shrink-0' />
            {status.label}
          </span>
          <p className='text-muted-foreground'>
            {valid
              ? `입력 합계 ${formatSats(inputSum)}가 송금액 + 수수료(${formatSats(amount + fee)})를 덮는다. 남는 ${formatSats(change)}은 잔돈으로 되돌아온다.`
              : selected.length === 0
                ? '동전을 하나도 고르지 않았다. 위에서 동전을 클릭해 보자.'
                : `입력 합계가 송금액 + 수수료보다 ${formatSats(shortfall)} 부족하다. 동전을 더 고르거나 금액을 줄여 보자.`}
          </p>
        </div>
      </Card>

      <Card className='flex flex-col gap-3 p-4'>
        <span className='text-sm font-semibold'>고른 동전이 새 동전으로</span>
        <Pipeline
          items={[
            {
              kind: 'box',
              label: `입력: 선택된 동전 ${selected.length}개`,
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
                  tone: 'good',
                },
                {
                  label: '출력 2 · 잔돈(내게 돌아옴)',
                  value: formatSats(change),
                  tone: 'accent',
                },
              ],
            },
            { kind: 'op', label: '남은 차액 = 채굴자 수수료' },
            { kind: 'box', label: '수수료', value: formatSats(fee) },
          ]}
        />
      </Card>

      <ExplainCard
        title='왜 항상 잔돈이 생길까?'
        preview='동전은 쪼갤 수 없고 통째로만 쓴다. 12만으로 8만을 보내면 잔돈이 돌아온다.'
        body={
          <>
            동전은 쪼개 쓸 수 없고 통째로만 쓸 수 있다. 12만 사토시 동전으로 8만을 보내면, 나머지는 <b>잔돈 출력</b>으로
            새 주소에 되돌려 받는다(그래서 지갑이 매번 새 주소를 만든다). 잔돈을 만들지 않으면 그 차액이 전부 수수료로
            날아가 버린다.
          </>
        }
      />

      <ExplainCard
        title='계좌 모델 vs UTXO 모델'
        preview='은행·이더리움은 잔액을 더하고 빼지만, 비트코인은 현금 동전을 주고받는다.'
        body={
          <>
            은행·이더리움은 <b>계좌 잔액</b>을 더하고 빼는 방식이다. 비트코인은 현금 지갑처럼 <b>동전(UTXO) 묶음</b>
            이다. 지갑 잔액은 그 동전들의 합을 화면에서 계산해 보여줄 뿐이다. 덕분에 어떤 동전이 어디서 왔는지 추적이
            쉽고, 여러 입력을 병렬로 검증할 수 있다.
          </>
        }
      />
    </div>
  );
}
