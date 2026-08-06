'use client';

import { ChartContainer } from '@/components/chart-container';
import { IndicatorCard } from '@/components/indicator-card';
import { LineSeries, useChart } from '@/hooks/use-chart';
import { cn } from '@/lib/utils';

export type MacroLine = {
  label?: string;
  data: { time: string; value: number }[];
  color: string;
};

type Props = {
  title: string;
  currentLabel?: string;
  changePercent?: number | null;
  lines?: MacroLine[];
  updatedLabel?: string;
  resetRef?: React.RefObject<(() => void) | null>;
  description?: string;
};

export function MacroChart({ title, currentLabel, changePercent, lines, updatedLabel, resetRef, description }: Props) {
  const { containerRef, resetView } = useChart(
    (chart) => {
      if (!lines) return;
      lines.forEach((line) => {
        const series = chart.addSeries(LineSeries, {
          color: line.color,
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: true,
          ...(line.label ? { title: line.label } : {}),
        });
        series.setData(line.data);
      });
    },
    [lines],
    { height: 240, resetRef },
  );

  return (
    <IndicatorCard
      title={title}
      updatedLabel={updatedLabel}
      ready={!!lines}
      headlineSkeletonClass='h-8 w-32'
      headline={
        <div className='flex items-end gap-2'>
          <span className='text-2xl font-bold'>{currentLabel}</span>
          {changePercent != null && (
            <span
              className={cn(
                'mb-1 text-sm font-semibold',
                changePercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
              )}
            >
              {changePercent >= 0 ? '▲' : '▼'} {Math.abs(changePercent)}%
            </span>
          )}
        </div>
      }
      height={240}
      chart={<ChartContainer containerRef={containerRef} onReset={resetView} />}
      description={description}
    />
  );
}
