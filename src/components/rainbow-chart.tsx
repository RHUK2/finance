"use client";

import { useEffect, useMemo } from "react";
import { AreaSeries, LineSeries } from "lightweight-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer } from "@/components/chart-container";
import { useChart } from "@/hooks/use-chart";
import {
  RAINBOW_BANDS,
  daysSinceGenesis,
  generateModelDates,
  powerLawPrice,
} from "@/lib/bitcoin-models";
import type { BitcoinHistoricalData } from "@/hooks/use-crypto";

const twoYearsLater = new Date(Date.now() + 2 * 365 * 86_400_000)
  .toISOString()
  .slice(0, 10);
const modelDates = generateModelDates("2012-01-01", twoYearsLater, 14);
const BAND_DATA = RAINBOW_BANDS.map((band) =>
  modelDates.flatMap((time) => {
    const value = powerLawPrice(daysSinceGenesis(time)) * band.upper;
    return value >= 0.01 ? [{ time, value }] : [];
  }),
);

type Props = {
  data?: BitcoinHistoricalData;
  resetRef?: React.RefObject<(() => void) | null>;
  updatedLabel?: string;
};

export function RainbowChart({ data, resetRef, updatedLabel }: Props) {
  const { containerRef, resetView } = useChart(
    (chart) => {
      if (!data) return;
      for (let i = RAINBOW_BANDS.length - 1; i >= 0; i--) {
        const band = RAINBOW_BANDS[i];
        const series = chart.addSeries(AreaSeries, {
          lineColor: band.color,
          lineWidth: 1,
          topColor: band.color,
          bottomColor: band.color,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });
        series.setData(BAND_DATA[i]);
      }
      const priceSeries = chart.addSeries(LineSeries, {
        color: "#ffffff",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
      });
      priceSeries.setData(data.history);
    },
    [data],
    { height: 320, logScale: true },
  );

  useEffect(() => {
    if (resetRef) resetRef.current = resetView;
  }, [resetRef, resetView]);

  const currentBand = useMemo(() => {
    if (!data?.history.length) return null;
    const latest = data.history[data.history.length - 1];
    const ratio = latest.value / powerLawPrice(daysSinceGenesis(latest.time));
    return (
      RAINBOW_BANDS.find((b) => ratio < b.upper) ??
      RAINBOW_BANDS[RAINBOW_BANDS.length - 1]
    );
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-muted-foreground text-sm font-medium">레인보우 차트</CardTitle>
          {updatedLabel && <span className="text-muted-foreground text-xs">{updatedLabel}</span>}
        </div>
        {!data ? (
          <Skeleton className="h-5 w-24" />
        ) : (
          currentBand && (
            <span className="text-sm font-semibold" style={{ color: currentBand.color }}>
              {currentBand.label}
            </span>
          )
        )}
      </CardHeader>
      <CardContent className="p-0">
        {!data ? (
          <Skeleton className="h-[320px] w-full rounded-none" />
        ) : (
          <ChartContainer containerRef={containerRef} onReset={resetView} />
        )}
        <p className="bg-muted/50 text-muted-foreground border-t px-6 pt-3 pb-4 text-xs">
          Power Law 모델 기반의 9단계 밸류에이션 밴드. 현재 가격이 어느 색 구간에 위치하는지로 장기 사이클 대비 고평가·저평가 여부를 직관적으로 확인합니다.
        </p>
      </CardContent>
    </Card>
  );
}
