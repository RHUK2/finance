'use client';

import { useMemo } from 'react';

import { ChartContainer } from '@/components/chart-container';
import { IndicatorCard, type IndicatorStatus } from '@/components/indicator-card';
import { Badge } from '@/components/ui/badge';
import { LineSeries, createSeriesMarkers, useChart, type Time } from '@/hooks/use-chart';
import type { BitcoinHistoricalData } from '@/hooks/use-crypto';
import { movingAverage } from '@/lib/bitcoin-models';

type Props = {
  data?: BitcoinHistoricalData;
  resetRef?: React.RefObject<(() => void) | null>;
  updatedLabel?: string;
};

function getPiCycleStatus(ratio: number): IndicatorStatus {
  if (ratio >= 1) return { label: '천장 신호', variant: 'destructive' };
  if (ratio >= 0.9) return { label: '근접', variant: 'secondary' };
  return { label: '정상', variant: 'outline' };
}

export function PiCycleChart({ data, resetRef, updatedLabel }: Props) {
  const { sma111, sma350x2, crossovers } = useMemo(() => {
    if (!data) return { sma111: [], sma350x2: [], crossovers: [] };
    const sma111 = movingAverage(data.history, 111);
    const sma350x2 = movingAverage(data.history, 350).map((p) => ({
      time: p.time,
      value: p.value * 2,
    }));
    // 111일 MA가 350일 MA×2를 상향 돌파한 지점이 사이클 천장 신호
    const longMap = new Map(sma350x2.map((p) => [p.time, p.value]));
    const crossovers: { time: string }[] = [];
    let prevBelow = true;
    for (const p of sma111) {
      const long = longMap.get(p.time);
      if (long == null) continue;
      const below = p.value < long;
      if (prevBelow && !below) crossovers.push({ time: p.time });
      prevBelow = below;
    }
    return { sma111, sma350x2, crossovers };
  }, [data]);

  const { containerRef, resetView } = useChart(
    (chart) => {
      if (!data) return;
      const priceSeries = chart.addSeries(LineSeries, {
        color: '#6b7280',
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        title: 'BTC',
      });
      priceSeries.setData(data.history);

      const longSeries = chart.addSeries(LineSeries, {
        color: '#ef4444',
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        title: '350일 MA×2',
      });
      longSeries.setData(sma350x2);

      const shortSeries = chart.addSeries(LineSeries, {
        color: '#22c55e',
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        title: '111일 MA',
      });
      shortSeries.setData(sma111);

      if (crossovers.length) {
        createSeriesMarkers(
          priceSeries,
          crossovers.map((c) => ({
            time: c.time as Time,
            position: 'aboveBar' as const,
            color: '#ef4444',
            shape: 'arrowDown' as const,
            text: '천장',
          })),
        );
      }
    },
    [data, sma111, sma350x2, crossovers],
    { height: 320, logScale: true, resetRef },
  );

  const shortNow = sma111[sma111.length - 1]?.value;
  const longNow = sma350x2[sma350x2.length - 1]?.value;
  const ratio = shortNow != null && longNow ? shortNow / longNow : null;
  const status = ratio != null ? getPiCycleStatus(ratio) : null;

  return (
    <IndicatorCard
      title='Pi Cycle Top'
      updatedLabel={updatedLabel}
      ready={!!data}
      headlineSkeletonClass='h-5 w-24'
      headline={
        ratio != null &&
        status && (
          <div className='flex items-end gap-2'>
            <span className='text-sm font-semibold'>천장선 도달 {(ratio * 100).toFixed(0)}%</span>
            <Badge variant={status.variant} className='mb-0.5'>
              {status.label}
            </Badge>
          </div>
        )
      }
      height={320}
      chart={<ChartContainer containerRef={containerRef} onReset={resetView} />}
      description='111일 이동평균과 350일 이동평균×2의 교차로 읽습니다. 111일선이 350일선×2를 위로 돌파하는 순간이 사이클 천장 신호로, 과거 고점과 며칠 안쪽으로 맞아떨어져 단기 고점 경계 신호로 활용됩니다.'
    />
  );
}
