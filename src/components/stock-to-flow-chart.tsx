"use client";

import { useMemo } from "react";
import {
  LineSeries,
  LineStyle,
  createSeriesMarkers,
  type Time,
} from "lightweight-charts";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartSkeleton } from "@/components/chart-skeleton";
import { useChart } from "@/hooks/use-chart";
import { HALVING_DATES, s2fModelPrice, s2fRatio } from "@/lib/bitcoin-models";
import type { BitcoinHistoricalData } from "@/hooks/use-crypto";

type Props = {
  data: BitcoinHistoricalData;
};

export function StockToFlowChart({ data }: Props) {
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

  const latest = data.history[data.history.length - 1];
  const s2f = latest ? s2fRatio(latest.time) : null;
  const modelPrice = latest ? s2fModelPrice(latest.time) : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Stock-to-Flow 모델
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={resetView}
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">
          PlanB 2019 S2F 모델 예측가 (점선) vs 실제가격
        </p>
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
      <CardContent className="p-0 pb-4">
        <div ref={containerRef} />
      </CardContent>
    </Card>
  );
}

export function StockToFlowChartSkeleton() {
  return (
    <ChartSkeleton
      chartHeight={320}
      subtitleClassName="w-56"
      valueClassName="h-4 w-48"
    />
  );
}
