'use client';

import { useMemo, useRef } from 'react';
import { RotateCcw } from 'lucide-react';

import { MobileNavDrawer } from '@/components/mobile-nav-drawer';
import { FearGreedChart } from '@/components/fear-greed-chart';
import { MacroChart } from '@/components/macro-chart';
import { MayerMultipleChart } from '@/components/mayer-multiple-chart';
import { MvrvZScoreChart } from '@/components/mvrv-zscore-chart';
import { PageMain } from '@/components/page-main';
import { PiCycleChart } from '@/components/pi-cycle-chart';
import { PuellMultipleChart } from '@/components/puell-multiple-chart';
import { RainbowChart } from '@/components/rainbow-chart';
import { Button } from '@/components/ui/button';
import { CHART_SERIES } from '@/hooks/use-chart';
import { useBitcoinHistorical, useFearGreed, useMvrv } from '@/hooks/use-crypto';
import { useStrategy } from '@/hooks/use-stocks';
import { useRelativeTime } from '@/hooks/use-relative-time';
import { toMacroSeries } from '@/lib/series';
import { BTC_COLOR, formatUsdPrice } from '@/lib/utils';

const MSTR_COLOR = CHART_SERIES[0];
const STRC_COLOR = CHART_SERIES[1];

export function BitcoinView() {
  const fearGreedQuery = useFearGreed();
  const mvrvQuery = useMvrv();
  const historicalQuery = useBitcoinHistorical();
  const strategyQuery = useStrategy();
  const fearGreed = fearGreedQuery.data;
  const mvrv = mvrvQuery.data;
  const historical = historicalQuery.data;
  const strategy = strategyQuery.data;
  // 첫 데이터 없이 요청이 실패한 상태. 이전 데이터가 있으면 옛 값을 그대로 보인다.
  const fearGreedFailed = fearGreedQuery.isError && !fearGreed;
  const mvrvFailed = mvrvQuery.isError && !mvrv;
  const historicalFailed = historicalQuery.isError && !historical;
  const strategyFailed = strategyQuery.isError && !strategy;

  const btcReset = useRef<(() => void) | null>(null);
  const mstrReset = useRef<(() => void) | null>(null);
  const strcReset = useRef<(() => void) | null>(null);
  const fearGreedReset = useRef<(() => void) | null>(null);
  const mvrvZScoreReset = useRef<(() => void) | null>(null);
  const mayerReset = useRef<(() => void) | null>(null);
  const puellReset = useRef<(() => void) | null>(null);
  const rainbowReset = useRef<(() => void) | null>(null);
  const piCycleReset = useRef<(() => void) | null>(null);

  // 차트를 추가하면 이 배열에도 넣어야 "전체 스케일 초기화"가 함께 적용된다.
  const allResets = [
    btcReset,
    mstrReset,
    strcReset,
    fearGreedReset,
    mvrvZScoreReset,
    mayerReset,
    puellReset,
    rainbowReset,
    piCycleReset,
  ];

  function resetAll() {
    allResets.forEach((r) => r.current?.());
  }

  const fearGreedRelTime = useRelativeTime(fearGreed?.fetchedAt);
  const mvrvRelTime = useRelativeTime(mvrv?.fetchedAt);
  const historicalRelTime = useRelativeTime(historical?.fetchedAt);
  const strategyRelTime = useRelativeTime(strategy?.fetchedAt);

  // BTC 가격은 아래 네 지표(메이어·푸엘·레인보우·파이사이클)가 이미 쓰는 시계열에서
  // 끌어온다. 시세용 소스를 따로 붙이면 같은 화면에서 BTC 가격이 둘로 갈린다.
  const btc = useMemo(() => (historical ? toMacroSeries(historical.history) : undefined), [historical]);

  // lines 배열의 참조를 고정해 useChart가 리렌더마다 차트를 재생성하지 않게 한다
  // (useRelativeTime이 매분 리렌더를 일으키므로 인라인 배열이면 줌 상태까지 초기화된다).
  const btcLines = useMemo(() => (btc ? [{ data: btc.history, color: BTC_COLOR }] : undefined), [btc]);
  const mstrLines = useMemo(
    () => (strategy ? [{ data: strategy.mstr.history, color: MSTR_COLOR }] : undefined),
    [strategy],
  );
  const strcLines = useMemo(
    () => (strategy ? [{ data: strategy.strc.history, color: STRC_COLOR }] : undefined),
    [strategy],
  );

  return (
    <>
      <MobileNavDrawer />
      <PageMain>
        <div className='flex flex-col gap-3'>
          <div className='flex items-center'>
            <Button variant='outline' size='sm' onClick={resetAll}>
              <RotateCcw className='size-3.5' />
              <span className='text-xs'>전체 스케일 초기화</span>
            </Button>
          </div>
          <MacroChart
            title='비트코인 (BTC)'
            currentLabel={btc?.current != null ? formatUsdPrice(btc.current, 0) : '-'}
            formatValue={(v) => formatUsdPrice(v, 0)}
            changePercent={btc?.changePercent ?? null}
            lines={btcLines}
            updatedLabel={historicalRelTime ?? undefined}
            error={historicalFailed}
            resetRef={btcReset}
            description='달러 기준 비트코인 가격. 아래 메이어 배수·푸엘 배수·레인보우·파이사이클이 모두 이 시계열에서 계산됩니다.'
          />
          <MacroChart
            title='스트래티지 (MSTR)'
            currentLabel={strategy?.mstr.current != null ? formatUsdPrice(strategy.mstr.current) : '-'}
            formatValue={(v) => formatUsdPrice(v)}
            changePercent={strategy?.mstr.changePercent ?? null}
            lines={mstrLines}
            updatedLabel={strategyRelTime ?? undefined}
            error={strategyFailed}
            resetRef={mstrReset}
            description='비트코인을 대차대조표에 쌓아 온 회사의 보통주. 주가에는 보유 비트코인의 가치 외에 자금 조달 여력과 그에 대한 시장의 기대가 함께 반영되어, 비트코인보다 크게 움직이는 구간이 많습니다.'
          />
          <MacroChart
            title='스트래티지 우선주 (STRC)'
            currentLabel={strategy?.strc.current != null ? formatUsdPrice(strategy.strc.current) : '-'}
            formatValue={(v) => formatUsdPrice(v)}
            changePercent={strategy?.strc.changePercent ?? null}
            lines={strcLines}
            updatedLabel={strategyRelTime ?? undefined}
            error={strategyFailed}
            resetRef={strcReset}
            description='같은 회사가 발행한 우선주. 배당이 먼저 지급되는 대신 주가 상승에 참여하는 몫이 제한되어, 보통주보다 비트코인 가격에 덜 붙어 움직입니다. 2025년 상장이라 히스토리가 보통주보다 짧습니다.'
          />
          <FearGreedChart
            data={fearGreed}
            error={fearGreedFailed}
            resetRef={fearGreedReset}
            updatedLabel={fearGreedRelTime ?? undefined}
          />
          <MvrvZScoreChart
            data={mvrv}
            error={mvrvFailed}
            resetRef={mvrvZScoreReset}
            updatedLabel={mvrvRelTime ?? undefined}
          />
          <MayerMultipleChart
            data={historical}
            error={historicalFailed}
            resetRef={mayerReset}
            updatedLabel={historicalRelTime ?? undefined}
          />
          <PuellMultipleChart
            data={historical}
            error={historicalFailed}
            resetRef={puellReset}
            updatedLabel={historicalRelTime ?? undefined}
          />
          <RainbowChart
            data={historical}
            error={historicalFailed}
            resetRef={rainbowReset}
            updatedLabel={historicalRelTime ?? undefined}
          />
          <PiCycleChart
            data={historical}
            error={historicalFailed}
            resetRef={piCycleReset}
            updatedLabel={historicalRelTime ?? undefined}
          />
        </div>
      </PageMain>
    </>
  );
}
