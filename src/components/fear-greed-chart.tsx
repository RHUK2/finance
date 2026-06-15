"use client";

import { useEffect } from "react";
import { ChartContainer } from "@/components/chart-container";
import { ChartSkeleton } from "@/components/chart-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useChart } from "@/hooks/use-chart";
import type { FearGreedData } from "@/hooks/use-crypto";
import { cn } from "@/lib/utils";
import { LineSeries, LineStyle } from "lightweight-charts";

const ZONE_LINES = [
  { price: 25, label: "극도의 공포", color: "#ef4444" },
  { price: 45, label: "공포", color: "#f97316" },
  { price: 55, label: "중립", color: "#eab308" },
  { price: 75, label: "탐욕", color: "#22c55e" },
];

const CLASSIFICATIONS: Record<string, { label: string; color: string }> = {
  "Extreme Fear": { label: "극도의 공포", color: "text-red-500" },
  Fear: { label: "공포", color: "text-orange-500" },
  Neutral: { label: "중립", color: "text-yellow-500" },
  Greed: { label: "탐욕", color: "text-green-500" },
  "Extreme Greed": { label: "극도의 탐욕", color: "text-green-600" },
};

type Props = {
  data: FearGreedData;
  resetRef?: React.RefObject<(() => void) | null>;
};

export function FearGreedChart({ data, resetRef }: Props) {
  const { containerRef, resetView } = useChart(
    (chart) => {
      const lineSeries = chart.addSeries(LineSeries, {
        color: "#a78bfa",
        lineWidth: 2,
        priceLineVisible: false,
      });
      lineSeries.setData(data.history);
      ZONE_LINES.forEach((zone) => {
        lineSeries.createPriceLine({
          price: zone.price,
          color: zone.color,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: zone.label,
        });
      });
    },
    [data.history],
    { timeVisible: true },
  );

  useEffect(() => {
    if (resetRef) resetRef.current = resetView;
  }, [resetRef, resetView]);

  const info = CLASSIFICATIONS[data.classification] ?? {
    label: data.classification,
    color: "text-foreground",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-muted-foreground text-sm font-medium">
          공포 & 탐욕 지수
        </CardTitle>
        <div className="flex items-end gap-2">
          <span className={cn("text-3xl font-bold", info.color)}>
            {data.value}
          </span>
          <span className={cn("mb-1 text-sm font-medium", info.color)}>
            {info.label}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ChartContainer containerRef={containerRef} onReset={resetView} />
        <div className="h-4" />
      </CardContent>
    </Card>
  );
}

export function FearGreedChartSkeleton() {
  return (
    <ChartSkeleton>
      <div className="flex items-end gap-2">
        <Skeleton className="h-9 w-16" />
        <Skeleton className="mb-1 h-4 w-14" />
      </div>
    </ChartSkeleton>
  );
}
