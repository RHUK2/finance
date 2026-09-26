'use client';

import { useState } from 'react';

import { Clock, ShieldCheck, TriangleAlert, Wallet } from 'lucide-react';

import { ControlSlider, CostBar, ExplainCard, Metric, SectionIntro, StatusBanner } from '@/components/simulation';
import { Panel } from '@/components/panel';
import { bcra, bcraLabel, deterred } from '@/lib/bcra';
import { formatUsd } from '@/lib/utils';

import { attackCost } from './models';

// 앞 탭의 기준점과 같은 값에서 출발한다. 슬라이더를 왼쪽으로 밀어 예산이 줄 때
// 공격 비용이 함께 주는 것을 보는 게 이 탭의 목적이다.
const BASE_ANNUAL = 12_500_000_000;

export function AttackCost() {
  const [annual, setAnnual] = useState(BASE_ANNUAL);
  const [hours, setHours] = useState(6);
  // 억제가 성립하는 지점에서 출발한다. 이 탭의 논지는 '지금도 공격이 남는 장사'가
  // 아니라 '예산이 줄면 억제가 어느 지점에서 깨지는가'라서, 깨진 상태를 첫 화면으로
  // 두면 슬라이더를 밀어 그 경계를 찾는 일 자체가 사라진다.
  const [gain, setGain] = useState(5_000_000);

  const cost = attackCost(annual, hours);
  const ratio = bcra(gain, cost);
  const safe = deterred(ratio);
  const max = Math.max(cost, gain);
  const shrink = annual / BASE_ANNUAL;

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='예산이 줄면 공격 비용도 같이 준다'>
        채굴은 경쟁 산업이라 장기적으로 수익이 비용에 수렴한다. 그래서 연간 보안 예산은 곧 네트워크 전체가 해시레이트에
        태우는 돈이고, 과반을 잠시 쥐려는 공격자는 같은 시간 동안 그만한 돈을 태워야 한다. 보안 예산이 보안 그 자체인
        이유가 여기 있다. 예산이 반이 되면 공격 비용도 반이 되고, 그때까지 비합리였던 공격이 합리가 되는 지점이
        나타난다.
      </SectionIntro>

      <Panel>
        <ControlSlider
          icon={<ShieldCheck className='size-4 text-good' />}
          label='연간 보안 예산'
          value={annual}
          onChange={setAnnual}
          min={100_000_000}
          max={200_000_000_000}
          scale='log'
          format={formatUsd}
          hint={`기준점 ${formatUsd(BASE_ANNUAL)}의 ${shrink >= 1 ? `${shrink.toFixed(1)}배` : `${(shrink * 100).toFixed(0)}%`}. 앞 탭이 계산하는 값이 이것이다.`}
        />
        <ControlSlider
          icon={<Clock className='size-4 text-series-1' />}
          label='공격 지속 시간'
          value={hours}
          onChange={setHours}
          min={1}
          max={72}
          step={1}
          format={(v) => `${v}시간`}
          hint='되돌리려는 거래의 확인 수만큼은 버텨야 한다. 6확인이면 약 1시간이다.'
        />
        <ControlSlider
          icon={<Wallet className='size-4 text-warn' />}
          label='노리는 이중지불 규모'
          value={gain}
          onChange={setGain}
          min={100_000}
          max={100_000_000_000}
          scale='log'
          format={formatUsd}
          hint='한 번의 재구성으로 되돌릴 수 있는 자기 거래의 총액이다. 거래소 입금 한도와 출금 대기 시간이 이 값의 현실적인 천장을 만든다.'
        />
      </Panel>

      <Panel className='gap-3'>
        <span className='text-sm font-medium'>이득과 비용</span>
        <CostBar label='공격 비용 (운영비)' value={cost} max={max} className='bg-series-1' />
        <CostBar label='이중지불 이득' value={gain} max={max} className='bg-bad-surface' />
      </Panel>

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
        <Metric label='공격 비용' value={formatUsd(cost)} sub={`${hours}시간치 해시레이트`} />
        <Metric label='이중지불 이득' value={formatUsd(gain)} sub='되돌린 자기 거래' />
        <Metric
          label='이득 ÷ 비용'
          value={bcraLabel(ratio)}
          tone={safe ? 'good' : 'bad'}
          sub={safe ? '1 미만이라 공격이 비합리' : '1을 넘어 공격이 합리'}
        />
      </div>

      <StatusBanner
        tone={safe ? 'good' : 'bad'}
        icon={safe ? <ShieldCheck className='size-4 shrink-0' /> : <TriangleAlert className='size-4 shrink-0' />}
      >
        <span className='leading-relaxed font-normal'>
          {safe
            ? '공격해서 얻는 것보다 태우는 것이 크다. 합리적 공격자는 이 조건에서 공격하지 않는다.'
            : '태우는 것보다 얻는 것이 크다. 이 조건에서는 공격이 남는 장사가 된다.'}
        </span>
      </StatusBanner>

      <ExplainCard
        icon={<TriangleAlert className='size-4 text-warn' />}
        title='이 계산이 과장하는 것과 축소하는 것'
        preview='과반을 쥐어도 할 수 있는 일은 제한적이지만, 값이 떨어지는 것은 가격도 마찬가지다.'
        body='과장하는 쪽부터. 과반 해시레이트로도 남의 과거 거래를 바꾸거나 없는 코인을 만들어 낼 수는 없다. 뒤집을 수 있는 것은 공격자 자신이 최근에 보낸 거래뿐이라 이득에는 현실적인 천장이 있다. 축소하는 쪽. 공격이 성공하면 그 사실 자체가 코인 값을 떨어뜨려 공격자가 손에 쥔 코인도 같이 값을 잃는다. 반대로 공격자가 이득을 코인이 아니라 이미 인출한 법정통화로 본다면 그 억제는 작동하지 않는다. 이 슬라이더들은 어느 쪽 가정도 강요하지 않으니, 두 가정에서 각각 어느 예산 수준이 위험해지는지를 직접 밀어 보는 편이 낫다.'
      />
    </div>
  );
}
