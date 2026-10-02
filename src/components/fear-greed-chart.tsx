'use client';

import { ChartContainer } from '@/components/chart-container';
import { IndicatorCard } from '@/components/indicator-card';
import { CHART_SERIES, LineSeries, addZoneLines, useChart } from '@/hooks/use-chart';
import type { FearGreedData } from '@/hooks/use-crypto';
import { cn } from '@/lib/utils';

const ZONE_LINES = [
  { price: 25, label: '극도의 공포', color: '#ef4444' },
  { price: 46, label: '공포', color: '#f97316' },
  { price: 54, label: '중립', color: '#eab308' },
  { price: 75, label: '탐욕', color: '#22c55e' },
];

const CLASSIFICATIONS: Record<string, { label: string; color: string }> = {
  'Extreme Fear': { label: '극도의 공포', color: 'text-red-500' },
  Fear: { label: '공포', color: 'text-orange-500' },
  Neutral: { label: '중립', color: 'text-yellow-500' },
  Greed: { label: '탐욕', color: 'text-green-500' },
  'Extreme Greed': { label: '극도의 탐욕', color: 'text-green-600' },
};

type Props = {
  data?: FearGreedData;
  resetRef?: React.RefObject<(() => void) | null>;
  updatedLabel?: string;
  /** 첫 데이터 없이 요청이 실패했다(IndicatorCard의 error) */
  error?: boolean;
};

export function FearGreedChart({ data, resetRef, updatedLabel, error }: Props) {
  const { containerRef, resetView } = useChart(
    (chart) => {
      if (!data) return;
      const lineSeries = chart.addSeries(LineSeries, {
        color: CHART_SERIES[1],
        lineWidth: 2,
        priceLineVisible: false,
      });
      lineSeries.setData(data.history);
      addZoneLines(lineSeries, ZONE_LINES);
    },
    [data],
    { timeVisible: true, resetRef },
  );

  const info = data
    ? (CLASSIFICATIONS[data.classification] ?? {
        label: data.classification,
        color: 'text-foreground',
      })
    : null;

  return (
    <IndicatorCard
      title='공포 & 탐욕 지수'
      updatedLabel={updatedLabel}
      ready={!!data}
      error={error}
      headline={
        data &&
        info && (
          <div className='flex items-end gap-2'>
            <span className={cn('text-3xl font-bold', info.color)}>{data.value}</span>
            <span className={cn('mb-1 text-sm font-medium', info.color)}>{info.label}</span>
          </div>
        )
      }
      height={280}
      chart={<ChartContainer containerRef={containerRef} onReset={resetView} />}
      description={
        <>
          시장 심리를 0~100으로 수치화한 지표. 보통 숫자 자체보다 &lsquo;극단&rsquo;에 주목해 거꾸로 읽힙니다.
          0~25(극도의 공포)는 공포가 지나쳐 과매도된 구간, 76~100(극도의 탐욕)은 낙관이 지나쳐 과열된 구간으로 해석되곤
          합니다.
        </>
      }
    />
  );
}
