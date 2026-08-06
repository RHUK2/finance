'use client';

import { useMemo, useState } from 'react';
import { Layers, Zap } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { ControlSlider, CostBar, ExplainCard, Metric, SectionIntro } from '@/components/simulation';
import { feeSats, formatSats, txVBytes } from '@/lib/tx-concept';

const SIMPLE_TX_VBYTES = txVBytes('native', 1, 2); // 전형적인 1-in-2-out 전송
const CHANNEL_TX_COUNT = 2; // 열기 + 닫기

export function OnchainComparison() {
  const [paymentCount, setPaymentCount] = useState(200);
  const [feeRate, setFeeRate] = useState(15);

  const { onchainFee, lightningFee, savings } = useMemo(() => {
    const perTxFee = feeSats(SIMPLE_TX_VBYTES, feeRate);
    const onchain = perTxFee * paymentCount;
    const lightning = perTxFee * CHANNEL_TX_COUNT;
    return { onchainFee: onchain, lightningFee: lightning, savings: onchain - lightning };
  }, [paymentCount, feeRate]);

  const max = Math.max(onchainFee, lightningFee);

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='왜 오프체인이 온체인보다 나을까: 온체인 발자국의 차이'>
        같은 횟수만큼 결제해도, 온체인으로 매번 보내면 트랜잭션마다 수수료가 붙는다. 라이트닝 채널 안에서는 몇 번을
        주고받든 온체인 트랜잭션이 <b>열기·닫기 2건</b>으로 고정된다. 결제 횟수를 늘려보면 그 차이가 얼마나 벌어지는지
        보인다.
      </SectionIntro>

      <Card className='flex flex-col gap-4 p-4'>
        <ControlSlider
          label='채널 안에서 주고받은 결제 횟수'
          value={paymentCount}
          onChange={setPaymentCount}
          min={1}
          max={1000}
          step={1}
          format={(v) => `${v.toLocaleString('ko-KR')}회`}
        />
        <ControlSlider
          label='수수료율'
          value={feeRate}
          onChange={setFeeRate}
          min={1}
          max={100}
          step={1}
          format={(v) => `${v} sat/vB`}
        />
      </Card>

      <Card className='flex flex-col gap-3 p-4'>
        <CostBar
          label={`온체인으로 ${paymentCount.toLocaleString('ko-KR')}번 보냈다면`}
          value={onchainFee}
          max={max}
          className='bg-rose-500'
          format={formatSats}
        />
        <CostBar
          label='라이트닝 채널 (열기 1건 + 닫기 1건)'
          value={lightningFee}
          max={max}
          className='bg-emerald-500'
          format={formatSats}
        />
      </Card>

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
        <Metric label='온체인 수수료 총합' value={formatSats(onchainFee)} tone='bad' />
        {/* 채널 안 결제에는 중계 노드 라우팅 수수료가 따로 붙는다. 여기서 비교하는 건 온체인 수수료뿐이다. */}
        <Metric label='라이트닝 온체인 수수료' value={formatSats(lightningFee)} tone='good' />
        <Metric label='절약액' value={formatSats(Math.max(0, savings))} tone='accent' />
      </div>

      <ExplainCard
        icon={<Layers className='size-4 text-sky-600 dark:text-sky-400' />}
        title='공짜는 아니다: 라이트닝의 한계'
        preview='채널 용량, 상대의 협조, 라우팅 경로 확보 같은 새로운 제약이 대신 생긴다.'
        body={
          <>
            수수료가 줄어드는 대신 다른 제약이 생긴다.
            <ul className='mt-2 list-disc space-y-1 pl-5'>
              <li>채널에 예치한 금액을 넘어서는 잔액은 보낼 수 없다(채널 용량 한도)</li>
              <li>상대가 온라인이 아니면 채널을 정상적으로 닫기 어렵다(강제 종료는 가능하지만 더 느리고 비쌈)</li>
              <li>목적지까지 유동성이 충분한 경로가 없으면 결제가 실패할 수 있다(라우팅 실패)</li>
              <li>상대가 구버전 잔액을 몰래 방송하지 않는지 감시해야 한다(watchtower 필요성)</li>
              <li>중계 노드를 거치는 결제에는 온체인 수수료와 별도로 라우팅 수수료가 붙는다(보통 아주 소액)</li>
            </ul>
          </>
        }
      />

      <ExplainCard
        icon={<Zap className='size-4 text-amber-500' />}
        title='온체인은 사라지지 않는다, 역할이 나뉠 뿐'
        preview='온체인은 채널을 여닫는 결제, 라이트닝은 그 사이 오가는 소액·잦은 결제를 맡는다.'
        body='온체인 트랜잭션 해부·스크립트 검증·블록 채굴에서 다룬 모든 규칙은 채널을 열고 닫는 순간에도 그대로 적용된다. 라이트닝은 온체인을 대체하는 게 아니라, 온체인 위에 오프체인 결제 레이어를 얹어 소액·잦은 결제를 값싸고 빠르게 처리하는 역할 분담이다.'
      />
    </div>
  );
}
