'use client';

import { useMemo } from 'react';

import { ChartContainer } from '@/components/chart-container';
import { IndicatorCard, ScoreHeadline, type IndicatorStatus } from '@/components/indicator-card';
import { CHART_SERIES, CHART_TONE, LineSeries, addZoneLines, useChart } from '@/hooks/use-chart';
import type { BitcoinHistoricalData } from '@/hooks/use-crypto';
import { mayerMultiple, MAYER_THRESHOLDS } from '@/lib/bitcoin-models';

const ZONE_LINES = [
  { price: MAYER_THRESHOLDS.high, label: '과열', color: CHART_TONE.bad },
  { price: MAYER_THRESHOLDS.low, label: '저평가', color: CHART_TONE.good },
];

function getMayerStatus(value: number): IndicatorStatus {
  if (value >= MAYER_THRESHOLDS.high) return { label: '과열', variant: 'destructive' };
  if (value >= MAYER_THRESHOLDS.elevated) return { label: '고평가', variant: 'secondary' };
  if (value >= MAYER_THRESHOLDS.low) return { label: '적정', variant: 'outline' };
  return { label: '저평가', variant: 'secondary' };
}

type Props = {
  data?: BitcoinHistoricalData;
  resetRef?: React.RefObject<(() => void) | null>;
  updatedLabel?: string;
  /** 첫 데이터 없이 요청이 실패했다(IndicatorCard의 error) */
  error?: boolean;
};

export function MayerMultipleChart({ data, resetRef, updatedLabel, error }: Props) {
  const mayer = useMemo(() => mayerMultiple(data?.history ?? []), [data]);

  const { containerRef, resetView } = useChart(
    (chart) => {
      const lineSeries = chart.addSeries(LineSeries, {
        color: CHART_SERIES[1],
        lineWidth: 2,
        priceLineVisible: false,
      });
      lineSeries.setData(mayer);
      addZoneLines(lineSeries, ZONE_LINES);
    },
    [mayer],
    { resetRef },
  );

  const current = mayer[mayer.length - 1]?.value;

  return (
    <IndicatorCard
      title='Mayer Multiple'
      updatedLabel={updatedLabel}
      ready={!!data}
      error={error}
      headline={current != null && <ScoreHeadline value={current} status={getMayerStatus(current)} />}
      height={280}
      chart={<ChartContainer containerRef={containerRef} onReset={resetView} />}
      description={`현재 가격 ÷ 200일 이동평균. ${MAYER_THRESHOLDS.low}을 기준선으로 읽습니다. 보통 ${MAYER_THRESHOLDS.low} 미만은 장기 추세 아래의 저평가, ${MAYER_THRESHOLDS.high} 이상은 추세를 크게 벗어난 단기 과열로 읽힙니다.`}
    />
  );
}
