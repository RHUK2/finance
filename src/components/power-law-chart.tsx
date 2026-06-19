"use client";

import { useEffect } from "react";
import { LineSeries, LineStyle } from "lightweight-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartSkeleton } from "@/components/chart-skeleton";
import { ChartContainer } from "@/components/chart-container";
import { Skeleton } from "@/components/ui/skeleton";
import { useChart } from "@/hooks/use-chart";
import {
  daysSinceGenesis,
  generateModelDates,
  powerLawPrice,
} from "@/lib/bitcoin-models";
import type { BitcoinHistoricalData } from "@/hooks/use-crypto";

const twoYearsLater = new Date(Date.now() + 2 * 365 * 86_400_000)
  .toISOString()
  .slice(0, 10);
const modelDates = generateModelDates("2012-01-01", twoYearsLater, 7);
const makeLine = (mult: number) =>
  modelDates.flatMap((time) => {
    const value = powerLawPrice(daysSinceGenesis(time)) * mult;
    return value >= 0.01 ? [{ time, value }] : [];
  });
const MODEL_LINES = {
  center: makeLine(1),
  upper: makeLine(5),
  lower: makeLine(0.2),
};

type Props = {
  data: BitcoinHistoricalData;
  resetRef?: React.RefObject<(() => void) | null>;
  updatedLabel?: string;
};

export function PowerLawChart({ data, resetRef, updatedLabel }: Props) {
  const { containerRef, resetView } = useChart(
    (chart) => {
      const upperSeries = chart.addSeries(LineSeries, {
        color: "#ef4444",
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      upperSeries.setData(MODEL_LINES.upper);

      const lowerSeries = chart.addSeries(LineSeries, {
        color: "#22c55e",
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      lowerSeries.setData(MODEL_LINES.lower);

      const centerSeries = chart.addSeries(LineSeries, {
        color: "#a78bfa",
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
        title: "모델",
      });
      centerSeries.setData(MODEL_LINES.center);

      const priceSeries = chart.addSeries(LineSeries, {
        color: "#f59e0b",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
        title: "BTC",
      });
      priceSeries.setData(data.history);
    },
    [data.history],
    { height: 320, logScale: true },
  );

  useEffect(() => {
    if (resetRef) resetRef.current = resetView;
  }, [resetRef, resetView]);

  const latest = data.history[data.history.length - 1];
  const modelNow = latest ? powerLawPrice(daysSinceGenesis(latest.time)) : null;
  const ratio = latest && modelNow ? latest.value / modelNow : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Power Law 모델
          </CardTitle>
          {updatedLabel && <span className="text-muted-foreground text-xs">{updatedLabel}</span>}
        </div>
        {ratio != null && (
          <span
            className="text-sm font-semibold"
            style={{ color: ratio > 1 ? "#f97316" : "#22c55e" }}
          >
            모델 대비 {ratio > 1 ? "+" : ""}
            {((ratio - 1) * 100).toFixed(0)}%
          </span>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <ChartContainer containerRef={containerRef} onReset={resetView} />
        <p className="bg-muted/50 text-muted-foreground border-t px-6 pt-3 pb-4 text-xs">
          비트코인 가격이 시간에 따라 로그 함수적으로 성장한다는 모델. 모델 중앙선 대비 현재 가격의 위치로 장기적인 과열·저평가 여부를 판단합니다.
        </p>
      </CardContent>
    </Card>
  );
}

export function PowerLawChartSkeleton() {
  return (
    <ChartSkeleton chartHeight={320} showUpdatedLabel>
      <Skeleton className="h-4 w-24" />
    </ChartSkeleton>
  );
}
