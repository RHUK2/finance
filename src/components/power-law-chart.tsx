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
};

export function PowerLawChart({ data, resetRef }: Props) {
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
        <CardTitle className="text-muted-foreground text-sm font-medium">
          Power Law 모델
        </CardTitle>
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
        <div className="h-4" />
      </CardContent>
    </Card>
  );
}

export function PowerLawChartSkeleton() {
  return (
    <ChartSkeleton chartHeight={320}>
      <Skeleton className="h-4 w-24" />
    </ChartSkeleton>
  );
}
