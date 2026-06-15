"use client";

import { useEffect, useMemo } from "react";
import {
  LineSeries,
  LineStyle,
  createSeriesMarkers,
  type Time,
} from "lightweight-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartSkeleton } from "@/components/chart-skeleton";
import { ChartContainer } from "@/components/chart-container";
import { Skeleton } from "@/components/ui/skeleton";
import { useChart } from "@/hooks/use-chart";
import { HALVING_DATES, s2fModelPrice, s2fRatio } from "@/lib/bitcoin-models";
import type { BitcoinHistoricalData } from "@/hooks/use-crypto";

type Props = {
  data: BitcoinHistoricalData;
  resetRef?: React.RefObject<(() => void) | null>;
};

export function StockToFlowChart({ data, resetRef }: Props) {
  const modelData = useMemo(
    () =>
      data.history.flatMap(({ time }) => {
        const value = s2fModelPrice(time);
        return value >= 1 ? [{ time, value }] : [];
      }),
    [data.history],
  );

  const { containerRef, resetView } = useChart(
    (chart) => {
      const modelSeries = chart.addSeries(LineSeries, {
        color: "#f59e0b",
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false,
        lastValueVisible: true,
        title: "S2F",
      });
      modelSeries.setData(modelData);

      const priceSeries = chart.addSeries(LineSeries, {
        color: "#3b82f6",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
        title: "BTC",
      });
      priceSeries.setData(data.history);

      const markers = HALVING_DATES.filter(
        (d) => d >= (data.history[0]?.time ?? ""),
      ).map((date, i) => ({
        time: date as Time,
        position: "belowBar" as const,
        color: "#f59e0b",
        shape: "arrowUp" as const,
        text: `반감기 ${i + 1}`,
      }));
      if (markers.length) createSeriesMarkers(priceSeries, markers);
    },
    [data.history, modelData],
    { height: 320, logScale: true },
  );

  useEffect(() => {
    if (resetRef) resetRef.current = resetView;
  }, [resetRef, resetView]);

  const latest = data.history[data.history.length - 1];
  const s2f = latest ? s2fRatio(latest.time) : null;
  const modelPrice = latest ? s2fModelPrice(latest.time) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-muted-foreground text-sm font-medium">
          Stock-to-Flow 모델
        </CardTitle>
        <div className="flex items-center gap-3">
          {modelPrice != null && (
            <span className="text-sm font-semibold text-amber-400">
              모델 $
              {modelPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </span>
          )}
          {latest && (
            <span className="text-muted-foreground text-sm">
              실제 $
              {latest.value.toLocaleString("en-US", {
                maximumFractionDigits: 0,
              })}
            </span>
          )}
          {s2f != null && (
            <span className="text-muted-foreground text-xs">
              S2F {s2f.toFixed(1)}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ChartContainer containerRef={containerRef} onReset={resetView} />
        <div className="h-4" />
      </CardContent>
    </Card>
  );
}

export function StockToFlowChartSkeleton() {
  return (
    <ChartSkeleton chartHeight={320}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-12" />
      </div>
    </ChartSkeleton>
  );
}
