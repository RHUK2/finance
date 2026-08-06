'use client';

import { useMemo } from 'react';

import { ChartContainer } from '@/components/chart-container';
import { IndicatorCard, ScoreHeadline, type IndicatorStatus } from '@/components/indicator-card';
import { LineSeries, addZoneLines, useChart } from '@/hooks/use-chart';
import type { BitcoinHistoricalData } from '@/hooks/use-crypto';
import { movingAverage } from '@/lib/bitcoin-models';

const ZONE_LINES = [
  { price: 2.4, label: '과열', color: '#ef4444' },
  { price: 1, label: '저평가', color: '#22c55e' },
];

function getMayerStatus(value: number): IndicatorStatus {
  if (value >= 2.4) return { label: '과열', variant: 'destructive' };
  if (value >= 1.5) return { label: '고평가', variant: 'secondary' };
  if (value >= 1) return { label: '적정', variant: 'outline' };
  return { label: '저평가', variant: 'secondary' };
}

type Props = {
  data?: BitcoinHistoricalData;
  resetRef?: React.RefObject<(() => void) | null>;
  updatedLabel?: string;
};

export function MayerMultipleChart({ data, resetRef, updatedLabel }: Props) {
  const mayer = useMemo(() => {
    if (!data) return [];
    const sma = movingAverage(data.history, 200);
    const smaMap = new Map(sma.map((p) => [p.time, p.value]));
    return data.history.flatMap((p) => {
      const ma = smaMap.get(p.time);
      return ma ? [{ time: p.time, value: p.value / ma }] : [];
    });
  }, [data]);

  const { containerRef, resetView } = useChart(
    (chart) => {
      const lineSeries = chart.addSeries(LineSeries, {
        color: '#a78bfa',
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
      headline={current != null && <ScoreHeadline value={current} status={getMayerStatus(current)} />}
      height={280}
      chart={<ChartContainer containerRef={containerRef} onReset={resetView} />}
      description='현재 가격 ÷ 200일 이동평균. 1을 기준선으로 읽습니다. 1 미만이면 장기 추세 아래의 저평가, 2.4 이상이면 추세를 크게 벗어난 단기 과열로 보고 사이클 내 진입·청산 타이밍을 가늠합니다.'
    />
  );
}
