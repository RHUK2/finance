'use client';

import { useState } from 'react';
import { CheckCircle2, Gauge, Repeat, XCircle } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { ControlSlider, ExplainCard, Metric, SectionIntro, StatusBanner } from '@/components/simulation';
import { canReplaceByFee } from '@/lib/p2p-concept';
import { feeSats, formatSats, txVBytes } from '@/lib/tx-concept';

// 시연용 고정 크기. 전형적인 Native SegWit 1-in-2-out 전송(약 140 vB).
const TX_VBYTES = txVBytes('native', 1, 2);

export function MempoolPolicy() {
  const [minRelayRate, setMinRelayRate] = useState(1);

  const [feeRate, setFeeRate] = useState(1);
  const fee = feeSats(TX_VBYTES, feeRate);
  const minFee = feeSats(TX_VBYTES, minRelayRate);
  const accepted = feeRate >= minRelayRate;

  const [oldFeeRate, setOldFeeRate] = useState(2);
  const [newFeeRate, setNewFeeRate] = useState(5);
  const oldFee = feeSats(TX_VBYTES, oldFeeRate);
  const newFee = feeSats(TX_VBYTES, newFeeRate);
  const rbf = canReplaceByFee(oldFee, newFee, TX_VBYTES, minRelayRate);

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='멤풀 문 앞의 검문: 최소 릴레이 수수료'>
        검증을 통과한 트랜잭션이라도 노드가 무조건 받아주진 않는다. 각 노드는 자기 <b>최소 릴레이 수수료율</b>보다 낮은
        tx는 &#39;스팸&#39;으로 보고 멤풀에 넣지 않고, 이웃에게 넘기지도 않는다(relay 거부). 아래 슬라이더로 이 노드의
        정책을 정하면, 그 값이 두 시연(수용 판정·RBF) 모두에 똑같이 적용된다.
      </SectionIntro>

      <Card className='flex flex-col gap-1.5 border-amber-500/30 bg-amber-500/3 p-4'>
        <ControlSlider
          icon={<Gauge className='size-4 text-amber-600 dark:text-amber-400' />}
          label='이 노드의 최소 릴레이 수수료율 (아래 두 시연 공통)'
          hint='기본값 1 sat/vB. 멤풀이 꽉 차면 노드가 이 값을 스스로 더 올리기도 한다.'
          value={minRelayRate}
          onChange={setMinRelayRate}
          min={0.5}
          max={5}
          step={0.5}
          format={(v) => `${v} sat/vB`}
        />
      </Card>

      <SectionIntro title='① 신규 트랜잭션 수용 판정'>
        방금 정한 최소 릴레이 수수료율을 기준으로, 이 트랜잭션의 수수료율이 그 문턱을 넘는지 확인한다.
      </SectionIntro>

      <Card className='flex flex-col gap-4 p-4'>
        <ControlSlider
          icon={<Gauge className='text-muted-foreground size-4' />}
          label='이 트랜잭션의 수수료율'
          value={feeRate}
          onChange={setFeeRate}
          min={0}
          max={10}
          step={0.5}
          format={(v) => `${v} sat/vB`}
        />

        <StatusBanner
          tone={accepted ? 'good' : 'bad'}
          icon={
            accepted ? (
              <CheckCircle2 className='size-4 shrink-0 text-emerald-600 dark:text-emerald-400' />
            ) : (
              <XCircle className='size-4 shrink-0 text-rose-600 dark:text-rose-400' />
            )
          }
        >
          {accepted
            ? `수수료 ${formatSats(fee)} ≥ 최소 ${formatSats(minFee)}. 멤풀에 들어가 이웃에게 전파된다.`
            : `수수료 ${formatSats(fee)} < 최소 ${formatSats(minFee)}. 거부되어 아무 데도 퍼지지 않는다.`}
        </StatusBanner>

        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
          <Metric label='이 tx 수수료' value={formatSats(fee)} tone='accent' />
          <Metric label='노드가 요구하는 최소' value={formatSats(minFee)} />
          <Metric label='결과' value={accepted ? '수용' : '거부'} tone={accepted ? 'good' : 'bad'} />
        </div>
      </Card>

      <SectionIntro title='② RBF: 멈춰 있는 tx를 수수료로 밀어내기'>
        낮은 수수료로 보낸 tx가 멤풀에서 오래 멈춰 있으면, <b>같은 동전을 쓰되 수수료만 올린 새 tx</b>로 원본을 대체할
        수 있다(Replace-By-Fee, BIP125). 단, 아무 금액이나 올리면 되는 게 아니라 늘어난 수수료가 최소 릴레이
        수수료율만큼은 더 내야 한다. 그래야 다시 퍼뜨리는 대역폭 비용을 낸 셈이 된다.
      </SectionIntro>

      <Card className='flex flex-col gap-4 p-4'>
        <p className='text-muted-foreground text-xs'>
          위에서 정한 최소 릴레이 수수료율(<span className='text-foreground font-medium'>{minRelayRate} sat/vB</span>)이
          여기서도 그대로 적용된다.
        </p>

        <ControlSlider
          icon={<Repeat className='text-muted-foreground size-4' />}
          label='원본 tx 수수료율 (멤풀에 멈춰 있음)'
          value={oldFeeRate}
          onChange={setOldFeeRate}
          min={0.5}
          max={10}
          step={0.5}
          format={(v) => `${v} sat/vB`}
        />
        <ControlSlider
          icon={<Repeat className='size-4 text-amber-600 dark:text-amber-400' />}
          label='대체 tx 수수료율'
          value={newFeeRate}
          onChange={setNewFeeRate}
          min={0.5}
          max={10}
          step={0.5}
          format={(v) => `${v} sat/vB`}
        />

        <StatusBanner
          tone={rbf.accepted ? 'good' : 'bad'}
          icon={
            rbf.accepted ? (
              <CheckCircle2 className='size-4 shrink-0 text-emerald-600 dark:text-emerald-400' />
            ) : (
              <XCircle className='size-4 shrink-0 text-rose-600 dark:text-rose-400' />
            )
          }
        >
          {rbf.accepted
            ? `수수료가 ${formatSats(rbf.feeDelta)} 늘어 요구치(${formatSats(rbf.requiredDelta)}) 이상이다. 대체된다.`
            : `수수료 증가분 ${formatSats(Math.max(0, rbf.feeDelta))}가 요구치(${formatSats(rbf.requiredDelta)})에 못 미친다. 대체 거부.`}
        </StatusBanner>

        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
          <Metric label='원본 수수료' value={formatSats(oldFee)} />
          <Metric label='대체 tx 수수료' value={formatSats(newFee)} tone='accent' />
          <Metric label='대체 결과' value={rbf.accepted ? '성공' : '거부'} tone={rbf.accepted ? 'good' : 'bad'} />
        </div>
      </Card>

      <ExplainCard
        title='최소 수수료가 고정값이 아닌 이유'
        preview='멤풀이 가득 차면 노드는 스스로 문턱을 올려 가장 낮은 수수료 tx부터 밀어낸다.'
        body={
          <>
            멤풀 용량(기본 300MB)이 꽉 차면 노드는 더 이상 아무 tx나 받아주지 않는다. 이미 들어 있는 tx 중{' '}
            <b>수수료율이 가장 낮은 것부터 밀어내고</b>, 그 밀려난 tx의 수수료율을 새로운 &#39;최소 릴레이 수수료&#39;로
            삼는다. 그래서 네트워크가 혼잡할수록 이 문턱은 1 sat/vB보다 훨씬 높아진다. 여기서는 시연을 위해 직접 조절할
            수 있게 했을 뿐이다.
          </>
        }
      />
    </div>
  );
}
