'use client';

import { ChartContainer } from '@/components/chart-container';
import { IndicatorCard, ScoreHeadline, type IndicatorStatus } from '@/components/indicator-card';
import { LineSeries, addZoneLines, useChart } from '@/hooks/use-chart';
import type { MvrvData } from '@/hooks/use-crypto';

const ZONE_LINES = [
  { price: 7, label: '천장 위험', color: '#ef4444' },
  { price: 0.1, label: '바닥 기회', color: '#22c55e' },
];

function getZScoreStatus(value: number): IndicatorStatus {
  if (value >= 7) return { label: '천장 위험', variant: 'destructive' };
  if (value >= 3) return { label: '고평가', variant: 'secondary' };
  if (value >= 0.1) return { label: '적정', variant: 'outline' };
  return { label: '바닥 기회', variant: 'secondary' };
}

type Props = {
  data?: MvrvData;
  resetRef?: React.RefObject<(() => void) | null>;
  updatedLabel?: string;
};

export function MvrvZScoreChart({ data, resetRef, updatedLabel }: Props) {
  const { containerRef, resetView } = useChart(
    (chart) => {
      if (!data) return;
      const lineSeries = chart.addSeries(LineSeries, {
        color: '#3b82f6',
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
      headline={current != null && <ScoreHeadline value={current} status={getZScoreStatus(current)} />}
      height={280}
      chart={<ChartContainer containerRef={containerRef} onReset={resetView} />}
      description='시장가치(MV)와 실현가치(RV)의 괴리를 표준편차로 환산한 값. 이렇게 읽습니다. 7 이상이면 평균 대비 극단적 고평가(사이클 천장 경계), 0.1 미만이면 실현가치에 근접하거나 밑도는 역사적 바닥권(장기 매집 구간)으로 해석합니다.'
    />
  );
}
