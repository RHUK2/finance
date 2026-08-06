'use client';

import { useMemo } from 'react';

import { ChartContainer } from '@/components/chart-container';
import { IndicatorCard, ScoreHeadline, type IndicatorStatus } from '@/components/indicator-card';
import { LineSeries, addZoneLines, useChart } from '@/hooks/use-chart';
import type { BitcoinHistoricalData } from '@/hooks/use-crypto';
import { dailyIssuanceBtc, movingAverage } from '@/lib/bitcoin-models';

const ZONE_LINES = [
  { price: 4, label: '고평가', color: '#ef4444' },
  { price: 0.5, label: '저평가', color: '#22c55e' },
];

function getPuellStatus(value: number): IndicatorStatus {
  if (value >= 4) return { label: '고평가', variant: 'destructive' };
  if (value >= 1.5) return { label: '다소 높음', variant: 'secondary' };
  if (value >= 0.5) return { label: '적정', variant: 'outline' };
  return { label: '저평가 (채굴자 항복)', variant: 'secondary' };
}

type Props = {
  data?: BitcoinHistoricalData;
  resetRef?: React.RefObject<(() => void) | null>;
  updatedLabel?: string;
};

export function PuellMultipleChart({ data, resetRef, updatedLabel }: Props) {
  const puell = useMemo(() => {
    if (!data) return [];
    const issuanceUsd = data.history.map((p) => ({
      time: p.time,
      value: p.value * dailyIssuanceBtc(p.time),
    }));
    const ma365 = movingAverage(issuanceUsd, 365);
    const maMap = new Map(ma365.map((p) => [p.time, p.value]));
    return issuanceUsd.flatMap((p) => {
      const ma = maMap.get(p.time);
      return ma ? [{ time: p.time, value: p.value / ma }] : [];
    });
  }, [data]);

  const { containerRef, resetView } = useChart(
    (chart) => {
      const lineSeries = chart.addSeries(LineSeries, {
        color: '#f59e0b',
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
      headline={current != null && <ScoreHeadline value={current} status={getPuellStatus(current)} />}
      height={280}
      chart={<ChartContainer containerRef={containerRef} onReset={resetView} />}
      description='채굴자 일일 수익 ÷ 1년 평균 수익. 채굴자 행동으로 읽습니다. 4 이상이면 채굴자 수익이 과도해 매도 압력이 큰 과열, 0.5 미만이면 채굴자가 항복하는 수준이라 역사적 바닥 신호로 해석합니다.'
    />
  );
}
