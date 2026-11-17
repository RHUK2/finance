'use client';

import { useMemo } from 'react';

import { ChartContainer } from '@/components/chart-container';
import { IndicatorCard, ScoreHeadline, type IndicatorStatus } from '@/components/indicator-card';
import { CHART_SERIES, CHART_TONE, LineSeries, addZoneLines, useChart } from '@/hooks/use-chart';
import type { BitcoinHistoricalData } from '@/hooks/use-crypto';
import { puellMultiple, PUELL_THRESHOLDS } from '@/lib/bitcoin-models';

const ZONE_LINES = [
  { price: PUELL_THRESHOLDS.high, label: '고평가', color: CHART_TONE.bad },
  { price: PUELL_THRESHOLDS.low, label: '저평가', color: CHART_TONE.good },
];

function getPuellStatus(value: number): IndicatorStatus {
  if (value >= PUELL_THRESHOLDS.high) return { label: '고평가', variant: 'destructive' };
  if (value >= PUELL_THRESHOLDS.elevated) return { label: '다소 높음', variant: 'secondary' };
  if (value >= PUELL_THRESHOLDS.low) return { label: '적정', variant: 'outline' };
  return { label: '저평가 (채굴자 항복)', variant: 'secondary' };
}

type Props = {
  data?: BitcoinHistoricalData;
  resetRef?: React.RefObject<(() => void) | null>;
  updatedLabel?: string;
  /** 첫 데이터 없이 요청이 실패했다(IndicatorCard의 error) */
  error?: boolean;
};

export function PuellMultipleChart({ data, resetRef, updatedLabel, error }: Props) {
  const puell = useMemo(() => puellMultiple(data?.history ?? []), [data]);

  const { containerRef, resetView } = useChart(
    (chart) => {
      const lineSeries = chart.addSeries(LineSeries, {
        color: CHART_SERIES[0],
        lineWidth: 2,
        priceLineVisible: false,
      });
      lineSeries.setData(puell);
      addZoneLines(lineSeries, ZONE_LINES);
    },
    [puell],
    { resetRef },
  );

  const current = puell[puell.length - 1]?.value;

  return (
    <IndicatorCard
      title='Puell Multiple'
      updatedLabel={updatedLabel}
      ready={!!data}
      error={error}
      headline={current != null && <ScoreHeadline value={current} status={getPuellStatus(current)} />}
      height={280}
      chart={<ChartContainer containerRef={containerRef} onReset={resetView} />}
      description={`채굴자 일일 수익 ÷ 1년 평균 수익. 채굴자 행동으로 읽습니다. 보통 ${PUELL_THRESHOLDS.high} 이상은 채굴자 수익이 과도해 매도 압력이 큰 과열, ${PUELL_THRESHOLDS.low} 미만은 채굴자가 항복하는 수준의 역사적 바닥권으로 읽힙니다.`}
    />
  );
}
