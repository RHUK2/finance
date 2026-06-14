"use client";

import { LineSeries, LineStyle } from "lightweight-charts";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartSkeleton } from "@/components/chart-skeleton";
import { useChart } from "@/hooks/use-chart";
import type { FearGreedData } from "@/hooks/use-crypto";

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
};

export function FearGreedChart({ data }: Props) {
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

  const info = CLASSIFICATIONS[data.classification] ?? {
    label: data.classification,
    color: "text-foreground",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            공포 & 탐욕 지수
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
          Alternative.me 집계 · 0(극공포) ~ 100(극탐욕)
        </p>
        <div className="flex items-end gap-2">
          <span className={`text-3xl font-bold ${info.color}`}>
            {data.value}
          </span>
          <span className={`mb-1 text-sm font-medium ${info.color}`}>
            {info.label}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0 pb-4">
        <div ref={containerRef} />
      </CardContent>
    </Card>
  );
}

export function FearGreedChartSkeleton() {
  return <ChartSkeleton subtitleClassName="w-48" valueClassName="h-9 w-24" />;
}
