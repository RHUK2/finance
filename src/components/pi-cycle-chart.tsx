"use client";

import { useEffect, useMemo } from "react";
import { LineSeries, createSeriesMarkers, type Time } from "lightweight-charts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartSkeleton } from "@/components/chart-skeleton";
import { ChartContainer } from "@/components/chart-container";
import { Skeleton } from "@/components/ui/skeleton";
import { useChart } from "@/hooks/use-chart";
import { movingAverage } from "@/lib/bitcoin-models";
import type { BitcoinHistoricalData } from "@/hooks/use-crypto";

type Props = {
  data: BitcoinHistoricalData;
  resetRef?: React.RefObject<(() => void) | null>;
};

export function PiCycleChart({ data, resetRef }: Props) {
  const { sma111, sma350x2, crossovers } = useMemo(() => {
    const sma111 = movingAverage(data.history, 111);
    const sma350x2 = movingAverage(data.history, 350).map((p) => ({
      time: p.time,
      value: p.value * 2,
    }));
    // 111일 MA가 350일 MA×2를 상향 돌파한 지점이 사이클 천장 신호
    const longMap = new Map(sma350x2.map((p) => [p.time, p.value]));
    const crossovers: { time: string }[] = [];
    let prevBelow = true;
    for (const p of sma111) {
      const long = longMap.get(p.time);
      if (long == null) continue;
      const below = p.value < long;
      if (prevBelow && !below) crossovers.push({ time: p.time });
      prevBelow = below;
    }
    return { sma111, sma350x2, crossovers };
  }, [data.history]);

  const { containerRef, resetView } = useChart(
    (chart) => {
      const priceSeries = chart.addSeries(LineSeries, {
        color: "#6b7280",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        title: "BTC",
      });
      priceSeries.setData(data.history);

      const longSeries = chart.addSeries(LineSeries, {
        color: "#ef4444",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        title: "350일 MA×2",
      });
      longSeries.setData(sma350x2);

      const shortSeries = chart.addSeries(LineSeries, {
        color: "#22c55e",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        title: "111일 MA",
      });
      shortSeries.setData(sma111);

      if (crossovers.length) {
        createSeriesMarkers(
          priceSeries,
          crossovers.map((c) => ({
            time: c.time as Time,
            position: "aboveBar" as const,
            color: "#ef4444",
            shape: "arrowDown" as const,
            text: "천장",
          })),
        );
      }
    },
    [data.history, sma111, sma350x2, crossovers],
    { height: 320, logScale: true },
  );

  useEffect(() => {
    if (resetRef) resetRef.current = resetView;
  }, [resetRef, resetView]);

  const shortNow = sma111[sma111.length - 1]?.value;
  const longNow = sma350x2[sma350x2.length - 1]?.value;
  const ratio = shortNow != null && longNow ? shortNow / longNow : null;
  const status =
    ratio == null
      ? null
      : ratio >= 1
        ? { label: "천장 신호", variant: "destructive" as const }
        : ratio >= 0.9
          ? { label: "근접", variant: "secondary" as const }
          : { label: "정상", variant: "outline" as const };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-muted-foreground text-sm font-medium">
          Pi Cycle Top
        </CardTitle>
        {ratio != null && status && (
          <div className="flex items-end gap-2">
            <span className="text-sm font-semibold">
              천장선 도달 {(ratio * 100).toFixed(0)}%
            </span>
            <Badge variant={status.variant} className="mb-0.5">
              {status.label}
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <ChartContainer containerRef={containerRef} onReset={resetView} />
        <div className="h-4" />
      </CardContent>
    </Card>
  );
}

export function PiCycleChartSkeleton() {
  return (
    <ChartSkeleton chartHeight={320}>
      <div className="flex items-end gap-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mb-0.5 h-5 w-14 rounded-full" />
      </div>
    </ChartSkeleton>
  );
}
