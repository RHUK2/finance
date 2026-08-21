'use client';

import { useMemo, useState } from 'react';

import { Bitcoin, Cpu, ShieldCheck, Zap } from 'lucide-react';

import Link from 'next/link';

import { Card } from '@/components/ui/card';
import { ControlSlider, CostBar, ExplainCard, Metric, SectionIntro, StatusBanner } from '@/components/simulation';
import { bcra, bcraLabel, deterred } from '@/lib/bcra';
import { formatUsd } from '@/lib/utils';

import { attack51 } from './models';

export function AttackGame() {
  // 2026년 8월 기준 시장 상황을 기본값으로 둔다. 슬라이더로 바꿔 보는 게 이 탭의 목적이다.
  const [btcPrice, setBtcPrice] = useState(75000);
  const [networkHashrate, setNetworkHashrate] = useState(810);
  const [attackHours, setAttackHours] = useState(6);
  const [hardwareCostPerTH, setHardwareCostPerTH] = useState(15);
  const [electricity, setElectricity] = useState(0.05);

  const r = useMemo(
    () =>
      attack51({
        btcPrice,
        networkHashrate,
        attackHours,
        hardwareCostPerTH,
        electricity,
      }),
    [btcPrice, networkHashrate, attackHours, hardwareCostPerTH, electricity],
  );

  const ratio = bcra(r.doubleSpendGain, r.attackCost);
  const safe = deterred(ratio);
  const max = Math.max(r.attackCost, r.doubleSpendGain);

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='51% 공격: 합리적이라면 정직하게 채굴한다'>
        네트워크 과반 해시파워를 확보하면 이론상 이중지불 공격이 가능하다. 문제는 그 해시파워를 갖추는 비용이다.
        장비값은 공격하든 정직하게 채굴하든 똑같이 치러야 하므로, 갈림길은 그 장비로 무엇을 할 것이냐다. 다만 51%로도
        남의 과거 거래를 바꾸거나 없는 코인을 만들어 낼 수는 없다. 뒤집을 수 있는 건 공격자 자신이 최근에 보낸
        거래뿐이며, 그 범위는{' '}
        <Link href='/chain-reorg' className='underline underline-offset-2'>
          체인 재구성·파이널리티
        </Link>{' '}
        페이지에서 따로 다룬다.
      </SectionIntro>

      <Card className='gap-4 p-4'>
        <ControlSlider
          icon={<Bitcoin className='size-4 text-amber-500' />}
          label='BTC 가격'
          value={btcPrice}
          onChange={setBtcPrice}
          min={10000}
          max={500000}
          step={5000}
          format={formatUsd}
        />
        <ControlSlider
          icon={<Cpu className='size-4 text-sky-500' />}
          label='네트워크 해시레이트'
          value={networkHashrate}
          onChange={setNetworkHashrate}
          min={100}
          max={1200}
          step={10}
          format={(v) => `${v} EH/s`}
        />
        <ControlSlider
          label='공격 지속 시간'
          value={attackHours}
          onChange={setAttackHours}
          min={1}
          max={72}
          format={(v) => `${v}시간`}
        />
        <ControlSlider
          label='장비 단가'
          value={hardwareCostPerTH}
          onChange={setHardwareCostPerTH}
          min={5}
          max={40}
          format={(v) => `$${v}/TH`}
        />
        <ControlSlider
          icon={<Zap className='size-4 text-amber-500' />}
          label='전기 요금'
          value={electricity}
          onChange={setElectricity}
          min={0.02}
          max={0.15}
          step={0.005}
          format={(v) => `$${v.toFixed(3)}/kWh`}
        />
      </Card>

      <Card className='gap-3 p-4'>
        <span className='text-sm font-medium'>비용 vs 이득</span>
        <CostBar
          label='공격 비용 (장비 + 전기)'
          value={r.attackCost}
          max={max}
          className='bg-rose-500'
          sub={`장비 ${formatUsd(r.hardwareCost)} · 전기 ${formatUsd(r.energyCost)}`}
        />
        <CostBar label='이중지불 이득 (최대 추정)' value={r.doubleSpendGain} max={max} className='bg-amber-500' />
      </Card>

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
        <Metric label='공격 비용' value={formatUsd(r.attackCost)} tone='bad' />
        <Metric label='BCRA (이득÷비용)' value={bcraLabel(ratio)} tone={safe ? 'good' : 'bad'} sub='1 미만이면 방어' />
        <Metric
          label='장비 회수 기간'
          value={`${r.paybackYears.toFixed(1)}년`}
          tone='good'
          sub={`정직 채굴 연 ${formatUsd(r.honestYearly)}`}
        />
      </div>

      <StatusBanner icon={<ShieldCheck className='size-5 shrink-0' />} tone={safe ? 'good' : 'bad'}>
        {safe ? (
          <span className='text-sm/relaxed font-normal'>
            BCRA가 <b className='text-emerald-600 dark:text-emerald-400'>{bcraLabel(ratio)}</b>다. 같은 장비를 정직
            채굴에 쓰면 <b>{r.paybackYears.toFixed(1)}년</b>이면 장비값을 회수하고 그 뒤로는 계속 번다. 공격은 그 자산을
            단 한 번의 이중지불과 맞바꾸는 선택이고, 성공하는 순간 신뢰가 무너져 BTC 가격이 폭락하면 채굴에만 쓰이는
            장비와 보유 코인이 함께 휴지가 된다.
          </span>
        ) : (
          <span className='text-sm/relaxed font-normal'>
            이 극단적 설정에선 BCRA가 <b className='text-rose-600 dark:text-rose-400'>{bcraLabel(ratio)}</b>로 1을 넘어
            이득이 비용을 앞선다. 하지만 공격이 성공하는 순간 BTC 신뢰가 붕괴해 가격이 폭락하므로, 노린 이득 자체가
            증발하고 보유 자산·장비도 함께 파괴된다. 자기 파괴적 공격은 여전히 비합리적이다.
          </span>
        )}
      </StatusBanner>

      <ExplainCard
        title='왜 과반을 쥔 공격자조차 정직하게 채굴할까?'
        preview='51%의 진짜 방어선은 암호가 아니라 공격자 자신의 이해관계다.'
        body='51% 공격의 진짜 방어선은 암호가 아니라 경제적 유인이다. 과반 해시파워를 갖출 정도의 투자자는 이미 네트워크의 최대 이해관계자다. 그가 네트워크를 공격해 신뢰를 깨면 자기 장비와 코인의 가치를 스스로 파괴하게 된다. 정직하게 채굴할 때 가장 큰 보상을 받도록 설계돼 있어, 공격은 늘 손해 보는 선택이 된다.'
      />
    </div>
  );
}
