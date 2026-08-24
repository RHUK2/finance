'use client';

import { useState } from 'react';

import { CalendarClock, Scale } from 'lucide-react';

import { ControlSlider, ExplainCard, Metric, SectionIntro, Sparkline, StatusBanner } from '@/components/simulation';
import { Card } from '@/components/ui/card';

import { FUNDING_CAP, basisCurves, fundingCost } from './models';

const pct2 = (n: number) => `${(n * 100).toFixed(3)}%`;
const pct0 = (n: number) => `${Math.round(n * 100)}%`;

export function PerpetualFunding() {
  const [longShare, setLongShare] = useState(0.7);
  const [days, setDays] = useState(30);

  const f = fundingCost(longShare, days);
  const { dated, perpetual } = basisCurves(longShare);
  const capped = Math.abs(f.perCharge) >= FUNDING_CAP - 1e-9;

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='만기가 없으면 무엇이 붙잡나'>
        앞의 세 탭은 전부 만기가 있는 계약이었다. 만기가 다가오면 선물 가격은 현물 가격으로 끌려간다. 벌어져 있으면
        차익거래자가 싼 쪽을 사고 비싼 쪽을 팔아 그 간극을 닫기 때문이고, 만기일에는 어차피 실물로 정산되므로 두 값이
        같아질 수밖에 없다. 그런데 비트코인에서 실제로 거래되는 것은 만기가 없는 무기한선물이다. 끌어당길 만기가 없는
        계약을 무엇이 현물에 붙잡아 두는가. 펀딩비다. 요율과 기간은 구조를 보여주기 위한 예시 수치다.
      </SectionIntro>

      <Card className='gap-4 p-4'>
        <ControlSlider
          icon={<Scale className='size-4 text-violet-500' />}
          label='롱 쏠림'
          hint='포지션이 롱 쪽으로 얼마나 기울어 있는지. 50%가 균형이고, 기울수록 기운 쪽이 반대편에 돈을 낸다. 값을 내면서 버티는 사람이 늘수록 쏠림이 되돌아온다.'
          value={longShare}
          onChange={setLongShare}
          min={0.5}
          max={0.9}
          step={0.01}
          format={pct0}
        />
        <ControlSlider
          icon={<CalendarClock className='size-4 text-sky-500' />}
          label='보유 기간'
          hint='포지션을 며칠 들고 있는지. 펀딩비는 8시간마다 한 번씩 빠져나가므로 하루에 세 번 청구된다.'
          value={days}
          onChange={setDays}
          min={1}
          max={90}
          step={1}
          format={(v) => `${Math.round(v)}일`}
        />
      </Card>

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
        <Metric
          label='8시간당 펀딩비'
          value={pct2(f.perCharge)}
          tone={capped ? 'bad' : undefined}
          sub={capped ? '상한에 걸렸다' : '롱이 숏에게 낸다'}
        />
        <Metric
          label='연환산'
          value={pct0(f.annualized)}
          tone={f.annualized > 1 ? 'bad' : f.annualized > 0.3 ? 'accent' : undefined}
          sub={`${f.charges}회 청구 예정`}
        />
        <Metric
          label='누적 잠식률'
          value={pct0(f.cumulative)}
          tone={f.cumulative > 0.1 ? 'bad' : undefined}
          sub={`${Math.round(days)}일 들고 있으면 원금에서 이만큼 빠진다`}
        />
      </div>

      <Card className='gap-3 p-4'>
        <span className='text-sm font-semibold'>베이시스가 0으로 가는 두 가지 방법</span>
        <Sparkline values={dated} label='만기물' className='text-sky-500' min={0} max={3.3} heightClass='h-12' />
        <Sparkline
          values={perpetual}
          label='무기한물'
          className='text-violet-500'
          min={0}
          max={3.3}
          heightClass='h-12'
        />
        <p className='text-muted-foreground text-xs'>
          만기물은 만기라는 한 번의 사건이 베이시스를 0으로 끌고 간다. 무기한물에는 그 사건이 없어서, 8시간마다 돌아오는
          과금이 벌어진 만큼을 깎아 내고 쏠림이 다시 밀어 올리는 톱니가 반복된다. 쏠림이 셀수록 톱니의 진폭이 커진다.
        </p>
      </Card>

      <StatusBanner tone={f.cumulative > 0.08 ? 'bad' : f.cumulative > 0.03 ? 'accent' : 'good'}>
        롱 {pct0(longShare)} 쏠림에서 {Math.round(days)}일을 버티면 원금의 {pct0(f.cumulative)}가 반대편으로 넘어간다.
        방향을 맞혀도 그만큼을 먼저 벌어야 본전이다. 위험을 넘긴 대가는 만기물에서는 잠긴 가격으로 한 번에 청구되고,
        무기한물에서는 8시간마다 조금씩 청구된다.
      </StatusBanner>

      <ExplainCard
        title='펀딩비는 수수료가 아니다'
        preview='거래소가 가져가지 않는다. 반대편 포지션에 그대로 건너간다.'
        body='거래 수수료는 거래소가 가져가지만 펀딩비는 한쪽 포지션 보유자가 반대편 포지션 보유자에게 직접 낸다. 그래서 이것은 비용이라기보다 위험을 넘기는 값이다. 롱이 몰려 무기한선물이 현물 위로 뜨면, 그 상태를 유지하고 싶은 쪽이 반대 방향을 들고 버티는 쪽에게 값을 치른다. 그 값이 충분히 커지면 반대편을 드는 것이 이익이 되어 사람이 붙고, 쏠림이 되돌아오며 가격이 현물로 당겨진다. 만기라는 외부 사건 없이도 두 값이 붙어 있는 이유가 이것이다. 페이지 전체를 관통하는 이야기가 여기서 한 번 더 반복된다. 위험은 사라지지 않고, 그것을 받아 줄 사람에게 값이 매겨져 넘어간다.'
      />
    </div>
  );
}
