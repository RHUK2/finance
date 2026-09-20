'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Bitcoin, Hourglass, Receipt, ShieldCheck, TriangleAlert } from 'lucide-react';

import { ControlSlider, ExplainCard, Metric, SectionIntro, StackedBar, StatusBanner } from '@/components/simulation';
import { Panel } from '@/components/panel';
import { formatUsd } from '@/lib/utils';

import { blockRevenue, eraStartYear, LAST_SUBSIDY_ERA, requiredFee } from './models';

// 기준점. 2026년 언저리의 대략적인 시장 상황이고, 이 페이지의 모든 '지금 대비'는
// 이 한 점에서 나온다. 정확한 실측값이 아니라 비교의 원점이다.
const BASE = { era: 4, btcPrice: 75_000, feePerBlock: 0.05 };
const BASE_ANNUAL = blockRevenue(BASE).annualUsd;

const fmtFee = (n: number) =>
  n >= 0.01 ? `${n.toFixed(2)} BTC` : `${Math.round(n * 1e8).toLocaleString('ko-KR')} sat`;

export function FeeGap() {
  const [era, setEra] = useState(10);
  const [btcPrice, setBtcPrice] = useState(500_000);
  const [feePerBlock, setFeePerBlock] = useState(0.05);

  const r = blockRevenue({ era, btcPrice, feePerBlock });
  const ratio = r.annualUsd / BASE_ANNUAL;
  const need = requiredFee(BASE_ANNUAL, era, btcPrice);
  const needMultiple = need / BASE.feePerBlock;
  const enough = ratio >= 1;

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='보조금이 빠진 자리를 수수료가 메우려면'>
        채굴자가 한 블록에서 받는 돈은 보조금과 수수료의 합이다. 보안 예산이란 그 합에 한 해 블록 수를 곱한 것, 곧
        네트워크가 스스로를 지키는 데 해마다 쓰는 돈이다. 보조금은 정해진 대로 줄어드니 예산을 지키는 길은 둘뿐이다.
        가격이 오르거나, 블록당 수수료가 오르거나. 어느 쪽이 얼마나 필요한지 직접 밀어 보자. 지금 실제 멤풀 수수료는{' '}
        <Link href='/mempool' className='underline underline-offset-2'>
          비트코인 네트워크
        </Link>
        에서 본다.
      </SectionIntro>

      <Panel>
        <ControlSlider
          icon={<Hourglass className='size-4 text-sky-500' />}
          label='반감기 시대'
          value={era}
          onChange={setEra}
          min={0}
          max={LAST_SUBSIDY_ERA + 1}
          step={1}
          format={(v) => `${v}번째 · ${eraStartYear(v)}년~`}
        />
        <ControlSlider
          icon={<Bitcoin className='size-4 text-amber-500' />}
          label='BTC 가격'
          value={btcPrice}
          onChange={setBtcPrice}
          min={10_000}
          max={10_000_000}
          scale='log'
          format={formatUsd}
        />
        <ControlSlider
          icon={<Receipt className='size-4 text-emerald-500' />}
          label='블록당 수수료'
          value={feePerBlock}
          onChange={setFeePerBlock}
          min={0.001}
          max={10}
          scale='log'
          format={fmtFee}
          hint={`기준점은 ${fmtFee(BASE.feePerBlock)}다. 혼잡할 때 잠깐 그 열 배를 넘기도 하지만 평시 수준은 이 언저리다.`}
        />
      </Panel>

      <Panel className='gap-3'>
        <div className='flex items-baseline justify-between'>
          <span className='text-sm font-medium'>블록 보상의 구성</span>
          <span className='text-xs text-muted-foreground tabular-nums'>
            {fmtFee(r.totalBtc)} · {formatUsd(r.perBlockUsd)}
          </span>
        </div>
        <StackedBar
          segments={[
            { label: `보조금 ${fmtFee(r.subsidy)}`, value: r.subsidy, className: 'bg-amber-500' },
            { label: `수수료 ${fmtFee(feePerBlock)}`, value: feePerBlock, className: 'bg-emerald-500' },
          ]}
          total={r.totalBtc}
        />
        <p className='text-xs text-muted-foreground'>
          보조금은 프로토콜이 정하고 수수료는 블록 공간 경매가 정한다. 왼쪽 몫은 시대가 지날수록 반드시 줄고, 오른쪽
          몫이 얼마나 자랄지는 정해진 바 없다.
        </p>
      </Panel>

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
        <Metric
          label='연간 보안 예산'
          value={formatUsd(r.annualUsd)}
          tone={enough ? 'good' : 'bad'}
          sub={`기준의 ${ratio >= 10 ? Math.round(ratio) : ratio.toFixed(2)}배`}
        />
        <Metric
          label='수수료 비중'
          value={`${(r.feeShare * 100).toFixed(1)}%`}
          tone='accent'
          sub='채굴자 수입 중 수수료 몫'
        />
        <Metric
          label='필요한 블록당 수수료'
          value={fmtFee(need)}
          tone={need <= feePerBlock ? 'good' : 'bad'}
          sub={`기준 수수료의 ${needMultiple >= 10 ? Math.round(needMultiple) : needMultiple.toFixed(1)}배`}
        />
      </div>

      <StatusBanner
        tone={enough ? 'good' : 'bad'}
        icon={enough ? <ShieldCheck className='size-4 shrink-0' /> : <TriangleAlert className='size-4 shrink-0' />}
      >
        <span className='leading-relaxed font-normal'>
          {enough
            ? `지금 조건이면 보안 예산이 기준점보다 크다. 보조금이 줄어든 몫을 가격과 수수료가 함께 메웠다.`
            : `지금 조건이면 보안 예산이 기준점에 못 미친다. 같은 수준을 지키려면 블록당 수수료가 ${fmtFee(need)}여야 한다.`}
        </span>
      </StatusBanner>

      <ExplainCard
        icon={<Receipt className='size-4 text-emerald-500' />}
        title='수수료가 그만큼 오를 수 있나'
        preview='블록 공간은 고정인데 수요만 늘어야 한다. 그런데 그 수요를 오프체인으로 빼내는 것이 라이트닝이다.'
        body='수수료 총액은 블록 공간의 경매가격이다. 공간은 늘지 않으므로 총액이 오르려면 그 공간을 두고 다투는 수요가 커져야 한다. 여기에 긴장이 있다. 온체인 수수료가 감당할 수 없이 비싸지면 결제는 라이트닝 같은 상위 레이어로 옮겨가는데, 그러면 온체인 수요가 줄어 수수료가 다시 내려간다. 결제 수요만으로 보안 예산을 채우기 어렵다는 지적이 여기서 나온다. 반대편에서는 대형 정산과 채널 개폐 자체가 고가의 블록 공간 수요라고 본다. 어느 쪽이 맞는지는 아직 데이터로 갈리지 않았다.'
      />
      <ExplainCard
        icon={<Bitcoin className='size-4 text-amber-500' />}
        title='가격이 오르면 해결되는 것 아닌가'
        preview='반감기 하나를 상쇄하려면 가격이 두 배가 되어야 한다. 4년마다 영원히.'
        body='보조금은 BTC로 정해져 있으므로 달러로 환산한 보안 예산은 가격에 정비례한다. 반감기마다 보조금이 반이 되니, 예산을 유지하려면 4년마다 가격이 두 배가 되어야 한다. 지금까지는 대체로 그랬지만 그것은 영원히 계속될 수 없는 조건이다. 가격이 어느 수준에서 멈추면 그 뒤로는 반감기마다 보안 예산이 반토막 난다. 이 페이지가 묻는 것은 그때 무엇이 남느냐다.'
      />
    </div>
  );
}
