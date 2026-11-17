'use client';

import { ChartContainer } from '@/components/chart-container';
import { IndicatorCard, ScoreHeadline, type IndicatorStatus } from '@/components/indicator-card';
import { CHART_SERIES, CHART_TONE, LineSeries, addZoneLines, useChart } from '@/hooks/use-chart';
import type { MvrvData } from '@/hooks/use-crypto';
import { MVRV_THRESHOLDS } from '@/lib/bitcoin-models';

const ZONE_LINES = [
  { price: MVRV_THRESHOLDS.high, label: '천장 위험', color: CHART_TONE.bad },
  { price: MVRV_THRESHOLDS.low, label: '바닥 기회', color: CHART_TONE.good },
];

function getZScoreStatus(value: number): IndicatorStatus {
  if (value >= MVRV_THRESHOLDS.high) return { label: '천장 위험', variant: 'destructive' };
  if (value >= MVRV_THRESHOLDS.elevated) return { label: '고평가', variant: 'secondary' };
  if (value >= MVRV_THRESHOLDS.low) return { label: '적정', variant: 'outline' };
  return { label: '바닥 기회', variant: 'secondary' };
}

type Props = {
  data?: MvrvData;
  resetRef?: React.RefObject<(() => void) | null>;
  updatedLabel?: string;
  /** 첫 데이터 없이 요청이 실패했다(IndicatorCard의 error) */
  error?: boolean;
};

export function MvrvZScoreChart({ data, resetRef, updatedLabel, error }: Props) {
  const { containerRef, resetView } = useChart(
    (chart) => {
      if (!data) return;
      const lineSeries = chart.addSeries(LineSeries, {
        color: CHART_SERIES[3],
        lineWidth: 2,
        priceLineVisible: false,
      });
      lineSeries.setData(data.zScore);
      addZoneLines(lineSeries, ZONE_LINES);
    },
    [data],
    { resetRef },
  );

  const current = data?.zScore[data.zScore.length - 1]?.value;

  return (
    <IndicatorCard
      title='MVRV Z-Score'
      updatedLabel={updatedLabel}
      ready={!!data}
      error={error}
      headline={current != null && <ScoreHeadline value={current} status={getZScoreStatus(current)} />}
      height={280}
      chart={<ChartContainer containerRef={containerRef} onReset={resetView} />}
      description={`시장가치(MV)와 실현가치(RV)의 괴리를 표준편차로 환산한 값. 보통 ${MVRV_THRESHOLDS.high} 이상은 평균 대비 극단적 고평가(사이클 천장권), ${MVRV_THRESHOLDS.low} 미만은 시장가치가 실현가치에 근접하거나 밑도는 역사적 바닥권으로 읽힙니다.`}
    />
  );
}
