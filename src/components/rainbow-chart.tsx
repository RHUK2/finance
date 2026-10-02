'use client';

import { useMemo } from 'react';

import { ChartContainer } from '@/components/chart-container';
import { IndicatorCard } from '@/components/indicator-card';
import { AreaSeries, LineSeries, chartInk, useChart, useIsDarkChart } from '@/hooks/use-chart';
import type { BitcoinHistoricalData } from '@/hooks/use-crypto';
import { RAINBOW_BANDS, daysSinceGenesis, generateModelDates, powerLawPrice } from '@/lib/bitcoin-models';

const twoYearsLater = new Date(Date.now() + 2 * 365 * 86_400_000).toISOString().slice(0, 10);
const modelDates = generateModelDates('2012-01-01', twoYearsLater, 14);
const BAND_DATA = RAINBOW_BANDS.map((band) =>
  modelDates.flatMap((time) => {
    const value = powerLawPrice(daysSinceGenesis(time)) * band.upper;
    return value >= 0.01 ? [{ time, value }] : [];
  }),
);

type Props = {
  data?: BitcoinHistoricalData;
  resetRef?: React.RefObject<(() => void) | null>;
  updatedLabel?: string;
  /** 첫 데이터 없이 요청이 실패했다(IndicatorCard의 error) */
  error?: boolean;
};

export function RainbowChart({ data, resetRef, updatedLabel, error }: Props) {
  const isDark = useIsDarkChart();
  const { containerRef, resetView } = useChart(
    (chart) => {
      if (!data) return;
      for (let i = RAINBOW_BANDS.length - 1; i >= 0; i--) {
        const band = RAINBOW_BANDS[i];
        const series = chart.addSeries(AreaSeries, {
          lineColor: band.color,
          lineWidth: 1,
          topColor: band.color,
          bottomColor: band.color,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });
        series.setData(BAND_DATA[i]);
      }
      const priceSeries = chart.addSeries(LineSeries, {
        // 9색 밴드 위에 겹치는 선이라 밴드 색과 겹치지 않는 무채색을 쓴다.
        color: chartInk(isDark),
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
      });
      priceSeries.setData(data.history);
    },
    [data, isDark],
    { height: 320, logScale: true, resetRef },
  );

  const currentBand = useMemo(() => {
    if (!data?.history.length) return null;
    const latest = data.history[data.history.length - 1];
    const ratio = latest.value / powerLawPrice(daysSinceGenesis(latest.time));
    return RAINBOW_BANDS.find((b) => ratio < b.upper) ?? RAINBOW_BANDS[RAINBOW_BANDS.length - 1];
  }, [data]);

  return (
    <IndicatorCard
      title='레인보우 차트'
      updatedLabel={updatedLabel}
      ready={!!data}
      error={error}
      headlineSkeletonClass='h-5 w-24'
      headline={
        currentBand && (
          <span className='text-sm font-semibold' style={{ color: currentBand.color }}>
            {currentBand.label}
          </span>
        )
      }
      height={320}
      chart={<ChartContainer containerRef={containerRef} onReset={resetView} />}
      description={
        <>
          Power Law 회귀 기반의 9단계 밸류에이션 밴드. 가격 자체가 아니라 &lsquo;지금 어느 색 밴드에 있는지&rsquo;로
          읽습니다. 보통 한색(파랑) 구간은 저평가권, 난색(빨강) 구간은 고평가 과열권으로 읽혀 장기 사이클의 위치를
          가늠하는 데 쓰입니다.
        </>
      }
    />
  );
}
