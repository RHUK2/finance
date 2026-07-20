'use client';

import { useState } from 'react';
import { ArrowLeftRight, Lock, Unlock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ControlSlider,
  ExplainCard,
  Metric,
  SectionIntro,
  SegmentedControl,
  StatusBanner,
} from '@/components/simulation';
import { formatSats } from '@/lib/tx-concept';
import { type ChannelState, openChannel, payOffchain } from '@/lib/lightning-concept';

const FUNDING_SATS = 2_000_000;

export function PaymentChannel() {
  const [state, setState] = useState<ChannelState>(() => openChannel(FUNDING_SATS));
  const [direction, setDirection] = useState<'toBob' | 'toAlice'>('toBob');
  const [amount, setAmount] = useState(50_000);
  const [closed, setClosed] = useState(false);

  const alicePct = (state.aliceSats / FUNDING_SATS) * 100;

  function pay() {
    if (closed) return;
    setState((s) => payOffchain(s, direction === 'toBob', amount));
  }

  function reset() {
    setState(openChannel(FUNDING_SATS));
    setClosed(false);
  }

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='결제 채널: 온체인 트랜잭션 없이 수백 번 주고받기'>
        Alice와 Bob이 공동 자금을 <b>2-of-2 멀티시그 주소</b>에 예치하는 온체인 트랜잭션 하나로 채널을 연다. 그
        다음부터는 잔액을 나누는 새 합의(커밋먼트)에 둘 다 서명하는 방식으로 <b>온체인 기록 없이</b> 잔액을 주고받을 수
        있다. 마지막에 채널을 닫을 때만 최종 잔액으로 온체인 트랜잭션이 한 번 더 나간다.
      </SectionIntro>

      <Card className='flex flex-col gap-4 p-4'>
        <div className='flex items-center justify-between text-sm'>
          <span className='font-medium'>채널 잔액 (총 {formatSats(FUNDING_SATS)})</span>
          <span className='text-muted-foreground'>업데이트 {state.updateCount}회</span>
        </div>

        <div className='bg-muted flex h-8 w-full overflow-hidden rounded-md'>
          <div
            className='flex items-center justify-end bg-amber-500 pr-2 text-xs font-medium text-white transition-all duration-300'
            style={{ width: `${alicePct}%` }}
          >
            {alicePct > 15 && 'Alice'}
          </div>
          <div className='flex flex-1 items-center pl-2 text-xs font-medium text-white transition-all duration-300'>
            {100 - alicePct > 15 && 'Bob'}
          </div>
        </div>
        <div className='flex justify-between text-xs'>
          <span>{formatSats(state.aliceSats)}</span>
          <span>{formatSats(state.bobSats)}</span>
        </div>

        {!closed && (
          <>
            <div className='grid grid-cols-2 gap-3'>
              <SegmentedControl
                options={[
                  { value: 'toBob', label: 'Alice → Bob' },
                  { value: 'toAlice', label: 'Bob → Alice' },
                ]}
                value={direction}
                onChange={setDirection}
              />
              <Button onClick={pay} className='gap-1.5'>
                <ArrowLeftRight className='size-4' />
                오프체인 송금
              </Button>
            </div>
            <ControlSlider
              label='송금액'
              value={amount}
              onChange={setAmount}
              min={10_000}
              max={300_000}
              step={10_000}
              format={formatSats}
            />
          </>
        )}

        <div className='flex gap-2 border-t pt-3'>
          {!closed ? (
            <Button variant='outline' onClick={() => setClosed(true)} className='gap-1.5'>
              <Unlock className='size-4' />
              채널 닫기 (온체인 정산)
            </Button>
          ) : (
            <Button variant='outline' onClick={reset} className='gap-1.5'>
              <Lock className='size-4' />새 채널 열기
            </Button>
          )}
        </div>

        <StatusBanner tone={closed ? 'good' : undefined}>
          {closed
            ? `채널이 닫혔다. 최종 잔액(Alice ${formatSats(state.aliceSats)}, Bob ${formatSats(state.bobSats)})이 온체인 트랜잭션 한 번으로 각자 지갑에 기록된다.`
            : `지금까지 ${state.updateCount}번 잔액을 옮겼지만, 온체인에는 아직 아무 기록도 없다.`}
        </StatusBanner>

        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
          <Metric label='오프체인 업데이트' value={`${state.updateCount}회`} tone='accent' />
          <Metric label='온체인 트랜잭션' value='2건 (열기·닫기)' tone='good' />
          <Metric label='채널 상태' value={closed ? '닫힘' : '열림'} tone={closed ? undefined : 'good'} />
        </div>
      </Card>

      <ExplainCard
        title='최신 잔액만 유효하다고 어떻게 보장할까'
        preview='구버전 커밋먼트를 몰래 방송하면, 상대가 그 부정행위를 증명해 전액을 가져가는 벌칙 조항이 있다.'
        body={
          <>
            매번 새 커밋먼트에 서명할 때, 직전 버전을 사용하면 상대가 그 사실을 증명해{' '}
            <b>부정행위자의 몫 전부를 가져갈 수 있는 키</b>를 서로 교환해둔다(이 페이지는 그 벌칙 메커니즘 자체는 다루지
            않는다). 그래서 &#39;최신 잔액으로 닫는 것&#39;이 항상 가장 유리한 선택이 되고, 둘 다 자발적으로 최신 상태를
            유지하게 된다.
          </>
        }
      />
    </div>
  );
}
