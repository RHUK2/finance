'use client';

import { useCallback, useMemo, useState } from 'react';

import { ChartContainer } from '@/components/chart-container';
import { IndicatorCard } from '@/components/indicator-card';
import { LineSeries, useChart } from '@/hooks/use-chart';
import { cn } from '@/lib/utils';
import type { IChartApi } from 'lightweight-charts';

export type MacroLine = {
  label?: string;
  data: { time: string; value: number }[];
  color: string;
};

// 기간 탭. 기본은 '전체'라 탭을 건드리지 않으면 예전과 같은 그림이 나온다.
// 좁히는 쪽으로만 동작하므로 라우트가 내려보내는 기간(거시 2년, stocks 5년, strategy 7년)이
// 이 표의 상한이다. 여기 없는 기간을 보고 싶으면 탭이 아니라 라우트의 `years`를 고친다.
const RANGES = [
  { value: '1m', label: '1개월', days: 30 },
  { value: '6m', label: '6개월', days: 182 },
  { value: '1y', label: '1년', days: 365 },
  { value: 'all', label: '전체', days: Number.POSITIVE_INFINITY },
] as const;

type RangeKey = (typeof RANGES)[number]['value'];

function sliceRange<T extends { time: string }>(points: T[], range: RangeKey): T[] {
  const days = RANGES.find((r) => r.value === range)?.days ?? Number.POSITIVE_INFINITY;
  if (!Number.isFinite(days)) return points;
  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  const start = points.findIndex((p) => p.time >= cutoff);
  return start <= 0 ? points : points.slice(start);
}

function RangeTabs({ value, onChange }: { value: RangeKey; onChange: (v: RangeKey) => void }) {
  return (
    <div className='flex shrink-0 gap-0.5 rounded-md bg-muted p-0.5'>
      {RANGES.map((r) => (
        <button
          key={r.value}
          type='button'
          onClick={() => onChange(r.value)}
          className={cn(
            'rounded px-2 py-0.5 text-3xs transition-colors',
            value === r.value ? 'bg-background font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

type Props = {
  title: string;
  currentLabel?: string;
  changePercent?: number | null;
  lines?: MacroLine[];
  updatedLabel?: string;
  resetRef?: React.RefObject<(() => void) | null>;
  description?: string;
  /**
   * 커서가 놓인 지점의 값을 헤드라인에 찍을 때 쓰는 포매터. 넘기지 않으면 커서를 올려도
   * 헤드라인이 현재값 그대로다. 호출부가 통화·자릿수를 알고 있으므로 여기서 짐작하지 않는다.
   */
  formatValue?: (value: number) => string;
};

export function MacroChart({
  title,
  currentLabel,
  changePercent,
  lines,
  updatedLabel,
  resetRef,
  description,
  formatValue,
}: Props) {
  const [range, setRange] = useState<RangeKey>('all');
  const [hover, setHover] = useState<{ time: string; value: number } | null>(null);

  const shown = useMemo(() => lines?.map((l) => ({ ...l, data: sliceRange(l.data, range) })), [lines, range]);

  // 커서 값은 첫 번째 선에서만 읽는다. 선이 여럿인 차트(국채 2Y·10Y·30Y, WTI·브렌트)에서
  // 헤드라인이 가리키는 것도 첫 선이라 둘이 어긋나지 않는다.
  const primary = useMemo(() => new Map(shown?.[0]?.data.map((p) => [p.time, p.value])), [shown]);

  const setup = useCallback(
    (chart: IChartApi) => {
      if (!shown) return;
      shown.forEach((line) => {
        const series = chart.addSeries(LineSeries, {
          color: line.color,
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: true,
          ...(line.label ? { title: line.label } : {}),
        });
        series.setData(line.data);
      });

      if (!formatValue) return;
      chart.subscribeCrosshairMove((param) => {
        const time = typeof param.time === 'string' ? param.time : null;
        const value = time != null ? primary.get(time) : undefined;
        setHover(time != null && value != null ? { time, value } : null);
      });
    },
    [shown, primary, formatValue],
  );

  const { containerRef, resetView } = useChart(setup, [shown], { height: 240, resetRef });

  // 구간 수익률은 좁혔을 때만 보인다. '전체'에서는 헤드라인 옆 숫자가 예전처럼 전일 대비
  // 하나뿐이라, 탭을 건드리지 않은 화면은 이전과 같은 것을 말한다.
  const rangeReturn = useMemo(() => {
    if (range === 'all') return null;
    const points = shown?.[0]?.data;
    if (!points || points.length < 2 || points[0].value === 0) return null;
    return ((points[points.length - 1].value - points[0].value) / points[0].value) * 100;
  }, [shown, range]);

  const rangeLabel = RANGES.find((r) => r.value === range)?.label;
  const headlineValue = hover && formatValue ? formatValue(hover.value) : currentLabel;

  return (
    <IndicatorCard
      title={title}
      updatedLabel={updatedLabel}
      action={<RangeTabs value={range} onChange={setRange} />}
      ready={!!lines}
      headlineSkeletonClass='h-8 w-32'
      headline={
        <div>
          <div className='flex items-end gap-2'>
            <span className='text-2xl font-bold tabular-nums'>{headlineValue}</span>
            {changePercent != null && (
              <span className={cn('mb-1 text-sm font-semibold', changePercent >= 0 ? 'text-good' : 'text-bad')}>
                전일 {changePercent >= 0 ? '▲' : '▼'} {Math.abs(changePercent)}%
              </span>
            )}
            {rangeReturn != null && (
              <span className={cn('mb-1 text-sm', rangeReturn >= 0 ? 'text-good' : 'text-bad')}>
                {rangeLabel} {rangeReturn >= 0 ? '+' : ''}
                {rangeReturn.toFixed(1)}%
              </span>
            )}
          </div>
          {/* 커서가 올라간 동안에만 날짜가 뜬다. 평소에는 자리만 지켜 카드 높이가 흔들리지 않는다 */}
          <p className='h-4 text-3xs text-muted-foreground tabular-nums'>
            {hover ? `${hover.time} 기준` : updatedLabel ? `${updatedLabel} 갱신` : ''}
          </p>
        </div>
      }
      height={240}
      chart={<ChartContainer containerRef={containerRef} onReset={resetView} />}
      description={description}
    />
  );
}
