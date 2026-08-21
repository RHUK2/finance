'use client';

import { useState } from 'react';

import { Coins, TrendingUp } from 'lucide-react';

import { ControlSlider, ExplainCard, Metric, SectionIntro } from '@/components/simulation';
import { Card } from '@/components/ui/card';
import { useMarket } from '@/hooks/use-market';
import { cn, formatUsd } from '@/lib/utils';

import { impliedProbability, pricePerPointOfP, regimeImpliedPrice } from './models';

// 민감도 대비용 기준점. 저확률 구간에서 같은 1%포인트가 얼마나 다르게 작동하는지 보인다.
const REFERENCE_P = [0.05, 0.15, 0.5];

export function TwoRegime() {
  const [pPct, setPPct] = useState(5); // 성공 확률 %. 기본값은 대략의 현재 시세가 함의하는 값.
  const [winCapT, setWinCapT] = useState(32); // 성공 시 목표 시총 $T (기본값 ≈ 금 시가총액, models.ts 참조)

  // 성숙 곡선 탭이 쓰는 일간 종가가 아니라 실시간 시세를 쓴다. 종가는 하루 늦어
  // 자산 현황 페이지가 보여 주는 값과 어긋난다.
  const { data } = useMarket();
  const spot = data?.items.find((i) => i.symbol === 'BTC-USD')?.price ?? undefined;

  const p = pPct / 100;
  const winCap = winCapT * 1e12;
  const { winPrice, implied } = regimeImpliedPrice(p, winCap);
  const spotP = spot != null ? impliedProbability(spot, winCap) : null;

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='두 갈래 운명: 가격은 곧 확률이다'>
        이 탭은 비트코인의 미래 가치에 어중간한 중간이 없다고 <b>가정</b>한다. 진짜 화폐로 자리 잡아 거대한 시장을
        차지하거나(성공), 그러지 못해 0에 가까워지거나(실패) 둘 중 하나로만 본다. 실제로는 그 사이에 자리 잡을 여지도
        있지만, 이 단순한 가정을 받아들이면 오늘의 가격이 곧 <b>성공 확률 × 성공했을 때의 가격</b>이 되어 변동성의
        정체가 드러난다. 아래 슬라이더로 성공 확률을 직접 움직여 보자. 수치는 개념 이해용 예시다.
      </SectionIntro>

      <Card className='gap-4 p-4'>
        <ControlSlider
          icon={<TrendingUp className='size-4 text-amber-500' />}
          label='체제 전환 성공 확률 (p)'
          hint={
            spotP != null
              ? `지금 시세 ${formatUsd(spot!)}는 이 모델에서 성공 확률 ${(spotP * 100).toFixed(1)}%를 함의한다.`
              : "시장이 '비트코인이 끝내 진짜 화폐가 된다'고 믿는 정도. 이 한 숫자가 가격을 좌우한다."
          }
          value={pPct}
          onChange={setPPct}
          min={1}
          max={100}
          format={(v) => `${v}%`}
        />
        <ControlSlider
          icon={<Coins className='size-4 text-amber-500' />}
          label='성공 시 시장 규모'
          hint='성공했을 때 비트코인이 차지할 시장의 크기. 기본값은 금 시가총액이다.'
          value={winCapT}
          onChange={setWinCapT}
          min={1}
          max={50}
          format={(v) => `$${v}T`}
        />
      </Card>

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
        <Metric
          label='성공 시 가격'
          value={formatUsd(winPrice)}
          tone='good'
          sub={`${formatUsd(winCap)} ÷ 2,100만 개`}
        />
        <Metric label='실패 시 가격' value='$0' tone='bad' sub='성공하지 못하면' />
        <Metric label='현재 함의 가격' value={formatUsd(implied)} tone='accent' sub={`성공 확률 ${pPct}% 반영`} />
      </div>

      <Sensitivity p={p} />

      <ExplainCard
        title='왜 작은 확률 변화에 가격이 크게 뛸까'
        preview='확률 1%포인트가 만드는 가격 변화는 확률이 낮을수록 커진다.'
        body='가격이 성공 확률에 비례하므로, 확률이 1%포인트 오를 때의 가격 상승률은 지금 확률에 반비례한다. 확률이 5%일 때 1%포인트는 가격의 20%지만, 50%일 때 1%포인트는 2%에 지나지 않는다. 성패가 아직 불투명한 저확률 구간에서 같은 크기의 뉴스가 훨씬 큰 가격 변동을 만드는 이유다. 비트코인에 적정가의 기준이 없는 게 아니라, 그 기준이 아직 풀리지 않은 질문에 묶여 있다.'
      />
    </div>
  );
}

// 확률 1%포인트당 가격 변화율. 선형 그래프는 이 관계를 보여 주지 못한다.
// 가격 자체는 p에 비례해 직선이지만, 여기서 문제가 되는 건 상대 변화율이고 그건 1/p이다.
function Sensitivity({ p }: { p: number }) {
  const current = pricePerPointOfP(p);
  return (
    <Card className='gap-3 p-4'>
      <div className='flex items-baseline justify-between'>
        <span className='text-sm font-medium'>확률 1%포인트가 만드는 가격 변화</span>
        <span className='text-xl font-semibold text-amber-600 tabular-nums dark:text-amber-400'>
          +{(current * 100).toFixed(1)}%
        </span>
      </div>
      <div className='grid grid-cols-3 gap-2'>
        {REFERENCE_P.map((ref) => {
          const near = Math.abs(ref - p) < 0.025;
          return (
            <div
              key={ref}
              className={cn(
                'flex flex-col items-center rounded-md border p-2 text-xs',
                near ? 'border-amber-500/60 bg-amber-500/10' : 'text-muted-foreground',
              )}
            >
              <span>성공 확률 {Math.round(ref * 100)}%</span>
              <span className='mt-0.5 font-semibold tabular-nums'>+{(pricePerPointOfP(ref) * 100).toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
      <p className='text-muted-foreground text-xs/relaxed'>
        성패가 불투명할수록 같은 크기의 뉴스가 가격을 훨씬 크게 흔든다. 확률이 100%에 가까워지면 이 값은 1%에 수렴하고,
        비트코인은 평범한 자산처럼 움직이게 된다.
      </p>
    </Card>
  );
}
