'use client';

import { useState } from 'react';

import { Droplet, Flame } from 'lucide-react';

import {
  ControlSlider,
  CostBar,
  ExplainCard,
  Field,
  Metric,
  SectionIntro,
  SegmentedControl,
  StatusBanner,
} from '@/components/simulation';
import { Card } from '@/components/ui/card';

import { CRUDE_LOCK, type CrackHedge, GASOLINE_LOCK, crackResult } from './models';

const usd = (n: number) => `$${n.toFixed(2)}`;
// 마진은 음수가 될 수 있다. 막대는 최소폭으로 눕더라도 숫자는 부호까지 그대로 보인다.
const usdSigned = (n: number) => `${n < 0 ? '−' : ''}$${Math.abs(n).toFixed(2)}`;

const HEDGE_OPTIONS: { value: CrackHedge; label: string }[] = [
  { value: 'none', label: '헤지 없음' },
  { value: 'crude', label: '원유만 잠금' },
  { value: 'both', label: '양쪽 다 잠금' },
];

export function CrackSpread() {
  // 계약가와 같은 값에서 열면 세 선택지의 마진이 전부 같아 차이가 드러나지 않는다.
  // 원유가 오르고 휘발유가 처진 지점에서 열어 세 막대가 처음부터 갈리게 한다.
  const [crude, setCrude] = useState(88);
  const [gasoline, setGasoline] = useState(92);
  const [hedge, setHedge] = useState<CrackHedge>('none');

  const r = crackResult(crude, gasoline, hedge);
  const worst = Math.max(Math.abs(r.crackNow), Math.abs(r.margin), Math.abs(r.locked), 1);

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='위험 이전은 한 방향이 아니다'>
        정유사는 원유를 사는 동시에 휘발유를 판다. 사는 쪽 가격이 오르는 것도 위험이고 파는 쪽 가격이 내리는 것도
        위험이라, 한쪽만 잠그면 나머지 한쪽이 그대로 열려 있다. 두 가격의 차이를 크랙 스프레드라 부르며 정유사가 실제로
        지키려는 것은 어느 한쪽 가격이 아니라 이 차이다. 원유 1배럴이 휘발유 1배럴이 된다고 단순화했다. 실제 정제 수율은
        3:2:1이지만 그 계수는 여기서 하려는 이야기와 상관이 없다.
      </SectionIntro>

      <Card className='gap-4 p-4'>
        <ControlSlider
          icon={<Droplet className='size-4 text-amber-500' />}
          label='만기 원유가 (사는 쪽)'
          hint='정유사가 원료로 사야 하는 가격. 오르면 원가가 오른다.'
          value={crude}
          onChange={setCrude}
          min={40}
          max={120}
          step={1}
          format={usd}
        />
        <ControlSlider
          icon={<Flame className='size-4 text-rose-500' />}
          label='만기 휘발유가 (파는 쪽)'
          hint='정유사가 제품으로 파는 가격. 내리면 매출이 준다.'
          value={gasoline}
          onChange={setGasoline}
          min={50}
          max={150}
          step={1}
          format={usd}
        />
        <Field label='헤지 방식'>
          <SegmentedControl options={HEDGE_OPTIONS} value={hedge} onChange={setHedge} />
        </Field>
      </Card>

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
        <Metric label='지금 조건의 크랙' value={usdSigned(r.crackNow)} sub='헤지가 없을 때의 배럴당 마진' />
        <Metric
          label='이 헤지 방식의 마진'
          value={usdSigned(r.margin)}
          tone={r.margin > r.crackNow ? 'good' : r.margin < r.crackNow ? 'bad' : undefined}
          sub={hedge === 'both' ? '두 가격과 무관하게 고정' : '아직 시장에 노출됨'}
        />
        <Metric
          label='남아 있는 노출'
          value={r.exposedTo === 'none' ? '없음' : r.exposedTo === 'gasoline' ? '파는 쪽' : '양쪽'}
          tone={r.exposedTo === 'none' ? 'good' : 'bad'}
          sub={r.exposedTo === 'gasoline' ? '원가는 잠갔지만 판가는 열려 있다' : undefined}
        />
      </div>

      <Card className='gap-3 p-4'>
        <span className='text-sm font-semibold'>같은 시장에서 세 가지 선택이 만드는 마진</span>
        <CostBar
          label='헤지 없음'
          value={r.crackNow}
          max={worst}
          className='bg-rose-500'
          format={usdSigned}
          sub={`원유 ${usd(crude)}에 사서 휘발유 ${usd(gasoline)}에 판다. 두 가격이 다 움직인다`}
        />
        <CostBar
          label='원유만 잠금'
          value={gasoline - CRUDE_LOCK}
          max={worst}
          className='bg-amber-500'
          format={usdSigned}
          sub={`매입은 ${usd(CRUDE_LOCK)}에 고정. 휘발유가 빠지면 마진이 그대로 빠진다`}
        />
        <CostBar
          label='양쪽 다 잠금'
          value={r.locked}
          max={worst}
          className='bg-emerald-500'
          format={usdSigned}
          sub={`${usd(CRUDE_LOCK)}에 사서 ${usd(GASOLINE_LOCK)}에 판다. 두 슬라이더를 어디로 밀어도 안 움직인다`}
        />
      </Card>

      <StatusBanner tone={hedge === 'both' ? 'good' : r.margin < 5 ? 'bad' : 'accent'}>
        {hedge === 'both'
          ? `두 슬라이더를 어디로 밀어도 마진은 ${usd(r.locked)}에 붙어 있다. 정유사는 원유 가격도 휘발유 가격도 예측하지 않았고, 둘의 차이만 샀다.`
          : hedge === 'crude'
            ? `원가는 ${usd(CRUDE_LOCK)}에 잠겼지만 휘발유가 ${usd(gasoline)}까지 움직이면서 마진이 ${usdSigned(r.margin)}이 됐다. 절반만 잠그는 것은 절반만 안전한 게 아니라, 남은 절반에 전부를 건 것이다.`
            : `두 가격이 다 열려 있어 마진이 ${usdSigned(r.crackNow)}다. 두 슬라이더를 만지는 대로 이 숫자가 따라 움직인다. 원유와 휘발유를 같은 방향으로 밀면 마진이 거의 안 변하고, 벌리면 무너진다. 정유사를 죽이는 건 가격의 높낮이가 아니라 둘 사이의 벌어짐이다.`}
      </StatusBanner>

      <ExplainCard
        title='왜 크랙 스프레드 자체가 거래되는가'
        preview='정유사가 지키려는 것이 차이라면, 그 차이를 바로 사고팔면 된다.'
        body='정유사는 원유 롱과 휘발유 숏을 따로 잡는 대신 두 계약을 묶은 크랙 스프레드를 한 번에 거래하기도 한다. 지키려는 대상이 애초에 차이 하나라서, 두 다리를 각각 관리하면 한쪽만 체결되거나 물량이 어긋나는 위험이 새로 생기기 때문이다. 여기서 드러나는 것은 선물 시장이 파는 물건이 상품이 아니라 위험의 모양이라는 점이다. 누군가 특정한 모양의 위험을 벗고 싶어 하면 그 모양에 맞는 계약이 생겨나고, 그 반대편을 받아 줄 사람이 나타나는 한 시장은 성립한다.'
      />
    </div>
  );
}
