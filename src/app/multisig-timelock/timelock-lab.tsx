'use client';

import { useState } from 'react';

import { Card } from '@/components/ui/card';
import {
  ControlSlider,
  ExplainCard,
  Field,
  Metric,
  SectionIntro,
  SegmentedControl,
  StatusBanner,
} from '@/components/simulation';

type LockType = 'cltv' | 'csv';

const fmtBlocks = (v: number) => `${v.toLocaleString('ko-KR')}블록`;

export function TimelockLab() {
  const [type, setType] = useState<LockType>('cltv');

  // CLTV: 절대 블록 높이 기준.
  const [currentHeight, setCurrentHeight] = useState(850_000);
  const [unlockHeight, setUnlockHeight] = useState(852_000);

  // CSV: 이 UTXO가 생성된 시점부터 상대적으로 경과한 블록 수 기준.
  const [elapsedBlocks, setElapsedBlocks] = useState(100);
  const [requiredBlocks, setRequiredBlocks] = useState(144); // 약 하루치 블록 수

  const unlocked = type === 'cltv' ? currentHeight >= unlockHeight : elapsedBlocks >= requiredBlocks;

  const scriptPubKey =
    type === 'cltv'
      ? `<${unlockHeight}> OP_CHECKLOCKTIMEVERIFY OP_DROP <pubKey> OP_CHECKSIG`
      : `<${requiredBlocks}> OP_CHECKSEQUENCEVERIFY OP_DROP <pubKey> OP_CHECKSIG`;

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='타임락: 서명이 있어도 때가 되기 전엔 못 쓴다'>
        스크립트는 서명 검증 말고도 <b>시점 조건</b>을 걸 수 있다. OP_CHECKLOCKTIMEVERIFY(CLTV)는 특정 블록 높이(또는
        시각) 이후에만, OP_CHECKSEQUENCEVERIFY(CSV)는 이 UTXO가 생긴 뒤 일정 블록이 지나야만 지출을 허용한다. 서명은 늘
        유효해도, 조건을 만족하기 전엔 스크립트가 실패한다.
      </SectionIntro>

      <Card className='flex flex-col gap-4 p-4'>
        <Field label='잠금 방식'>
          <SegmentedControl
            options={[
              { value: 'cltv', label: '절대 시간 (CLTV)' },
              { value: 'csv', label: '상대 시간 (CSV)' },
            ]}
            value={type}
            onChange={setType}
          />
        </Field>

        {type === 'cltv' ? (
          <>
            <ControlSlider
              label='현재 블록 높이'
              value={currentHeight}
              onChange={setCurrentHeight}
              min={850_000}
              max={854_000}
              step={100}
              format={fmtBlocks}
            />
            <ControlSlider
              label='잠금 해제 높이 (locktime)'
              value={unlockHeight}
              onChange={setUnlockHeight}
              min={850_000}
              max={854_000}
              step={100}
              format={fmtBlocks}
            />
          </>
        ) : (
          <>
            <ControlSlider
              label='이 UTXO 생성 후 경과한 블록 수'
              value={elapsedBlocks}
              onChange={setElapsedBlocks}
              min={0}
              max={300}
              step={10}
              format={fmtBlocks}
            />
            <ControlSlider
              label='요구되는 경과 블록 수 (sequence)'
              value={requiredBlocks}
              onChange={setRequiredBlocks}
              min={0}
              max={300}
              step={10}
              format={fmtBlocks}
              hint='약 144블록 ≈ 하루'
            />
          </>
        )}
      </Card>

      <StatusBanner tone={unlocked ? 'good' : 'bad'}>
        {type === 'cltv'
          ? unlocked
            ? `현재 높이 ${fmtBlocks(currentHeight)} ≥ 해제 높이 ${fmtBlocks(unlockHeight)} → 지출 허용`
            : `현재 높이 ${fmtBlocks(currentHeight)} < 해제 높이 ${fmtBlocks(unlockHeight)} → 지출 거부`
          : unlocked
            ? `경과 ${fmtBlocks(elapsedBlocks)} ≥ 요구 ${fmtBlocks(requiredBlocks)} → 지출 허용`
            : `경과 ${fmtBlocks(elapsedBlocks)} < 요구 ${fmtBlocks(requiredBlocks)} → 지출 거부`}
      </StatusBanner>

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
        <Metric label='잠금 방식' value={type === 'cltv' ? '절대 시간' : '상대 시간'} tone='accent' />
        <Metric
          label='남은 블록'
          value={
            type === 'cltv'
              ? fmtBlocks(Math.max(0, unlockHeight - currentHeight))
              : fmtBlocks(Math.max(0, requiredBlocks - elapsedBlocks))
          }
        />
        <Metric label='결과' value={unlocked ? '지출 허용' : '지출 거부'} tone={unlocked ? 'good' : 'bad'} />
      </div>

      <Card className='flex flex-col gap-2 p-4'>
        <span className='text-sm font-medium'>scriptPubKey (잠금)</span>
        <div className='bg-muted rounded-md p-2 font-mono text-xs break-all'>{scriptPubKey}</div>
      </Card>

      <ExplainCard
        title='절대 시간(CLTV) vs 상대 시간(CSV), 뭐가 다를까'
        preview='CLTV는 "몇 번째 블록부터" 풀리고, CSV는 "이 UTXO가 생기고 몇 블록 뒤"에 풀린다.'
        body='CLTV는 블록체인 전체의 절대 높이(또는 절대 시각)를 기준으로 삼는다. 그래서 UTXO가 언제 만들어졌든 상관없이 지정된 높이가 되어야 풀린다. CSV는 그 UTXO 자신이 블록에 확정된 시점을 기준점 0으로 놓고, 거기서부터 몇 블록이 더 지나야 하는지를 센다. 같은 스크립트를 여러 UTXO에 재사용해도 "생성 후 30일" 같은 상대적 유예 기간을 각자 독립적으로 적용할 수 있다는 점이 CSV의 강점이다.'
      />
      <ExplainCard
        title='실전에서는 이렇게 쓰인다'
        preview='라이트닝 채널의 강제 종료 유예 기간, 상속 지갑, 에스크로 계약의 환불 기한 등.'
        body='라이트닝 네트워크에서 채널을 강제 종료하면, 상대방이 최신 잔액을 주장할 시간을 벌기 위해 CSV로 일정 블록(관행적으로 약 144블록, 하루 안팎) 동안 자금이 묶인다. CLTV는 "이 날짜 이후 상속인이 인출 가능"한 상속 지갑이나, "환불 기한을 넘기면 판매자가 대금을 회수"하는 에스크로 계약에 쓰인다. 둘 다 서명 검증(OP_CHECKSIG)과 결합해, 정당한 키를 가진 사람이라도 때가 되기 전엔 손댈 수 없게 만드는 데 쓰인다.'
      />
    </div>
  );
}
