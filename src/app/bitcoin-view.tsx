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
import { useMarket } from '@/hooks/use-market';
import { useStrategy } from '@/hooks/use-stocks';
import { useRelativeTime } from '@/hooks/use-relative-time';
import { toMacroSeries, withLive } from '@/lib/series';
import { BTC_COLOR, formatUsdPrice } from '@/lib/utils';

const MSTR_COLOR = CHART_SERIES[0];
const STRC_COLOR = CHART_SERIES[1];

export function BitcoinView() {
  const fearGreedQuery = useFearGreed();
  const mvrvQuery = useMvrv();
  const historicalQuery = useBitcoinHistorical();
  const strategyQuery = useStrategy();
  const quotes = useMarket().data;
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
  const quotesRelTime = useRelativeTime(quotes?.fetchedAt);

  // BTC 가격은 아래 네 지표(메이어·푸엘·레인보우·파이사이클)가 이미 쓰는 시계열에서
  // 끌어오고, 끝점만 같은 거래소(Coinbase)의 실시간 시세로 바꾼다. 네 지표는 일봉 지표라
  // 끝점을 바꾸지 않는다. 차트에는 히스토리를 그대로 넘기고(`lines`) 시세는 `live`로 따로 준다.
  const btcLive = quotes?.quotes.btc;
  const mstrLive = quotes?.quotes.mstr;
  const strcLive = quotes?.quotes.strc;
  const btc = useMemo(
    () => (historical ? withLive(toMacroSeries(historical.history), btcLive) : undefined),
    [historical, btcLive],
  );
  const mstr = useMemo(() => (strategy ? withLive(strategy.mstr, mstrLive) : undefined), [strategy, mstrLive]);
  const strc = useMemo(() => (strategy ? withLive(strategy.strc, strcLive) : undefined), [strategy, strcLive]);

  // lines 배열의 참조를 고정해 useChart가 리렌더마다 차트를 재생성하지 않게 한다
  // (useRelativeTime이 매분 리렌더를 일으키므로 인라인 배열이면 줌 상태까지 초기화된다).
  const btcLines = useMemo(
    () => (historical ? [{ data: historical.history, color: BTC_COLOR }] : undefined),
    [historical],
  );
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
            live={btcLive}
            updatedLabel={(btcLive ? quotesRelTime : historicalRelTime) ?? undefined}
            error={historicalFailed}
            resetRef={btcReset}
            description='달러 기준 비트코인 가격. 아래 메이어 배수·푸엘 배수·레인보우·파이사이클이 모두 이 시계열에서 계산됩니다.'
          />
          <MacroChart
            title='스트래티지 (MSTR)'
            currentLabel={mstr?.current != null ? formatUsdPrice(mstr.current) : '-'}
            formatValue={(v) => formatUsdPrice(v)}
            changePercent={mstr?.changePercent ?? null}
            lines={mstrLines}
            live={mstrLive}
            updatedLabel={(mstrLive ? quotesRelTime : strategyRelTime) ?? undefined}
            error={strategyFailed}
            resetRef={mstrReset}
            description='비트코인을 대차대조표에 쌓아 온 회사의 보통주. 주가에는 보유 비트코인의 가치 외에 자금 조달 여력과 그에 대한 시장의 기대가 함께 반영되어, 비트코인보다 크게 움직이는 구간이 많습니다.'
          />
          <MacroChart
            title='스트래티지 우선주 (STRC)'
            currentLabel={strc?.current != null ? formatUsdPrice(strc.current) : '-'}
            formatValue={(v) => formatUsdPrice(v)}
            changePercent={strc?.changePercent ?? null}
            lines={strcLines}
            live={strcLive}
            updatedLabel={(strcLive ? quotesRelTime : strategyRelTime) ?? undefined}
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
          {/* 지표 설명이 과열·바닥 같은 해석을 담고 있어 매매 신호로 오독되지 않게 한 번만 적는다(실데이터
              페이지라 IllustrativeDisclaimer가 아니라 자체 문단이다) */}
          <p className='text-xs/relaxed text-muted-foreground'>
            이 화면의 지표와 해석은 과거 데이터에서 흔히 쓰이는 읽는 법을 소개한 것이며 투자 조언이 아닙니다. 같은
            신호가 다음 사이클에도 맞는다는 보장은 없습니다.
          </p>
        </div>
      </PageMain>
    </>
  );
}
