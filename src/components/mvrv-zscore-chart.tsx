"use client";

import { useEffect } from "react";
import { LineSeries, LineStyle } from "lightweight-charts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartSkeleton } from "@/components/chart-skeleton";
import { ChartContainer } from "@/components/chart-container";
import { Skeleton } from "@/components/ui/skeleton";
import { useChart } from "@/hooks/use-chart";
import type { MvrvData } from "@/hooks/use-crypto";

const ZONE_LINES = [
  { price: 7, label: "천장 위험", color: "#ef4444" },
  { price: 0.1, label: "바닥 기회", color: "#22c55e" },
];

function getZScoreStatus(value: number) {
  if (value >= 7) return { label: "천장 위험", variant: "destructive" as const };
  if (value >= 3) return { label: "고평가", variant: "secondary" as const };
  if (value >= 0.1) return { label: "적정", variant: "outline" as const };
  return { label: "바닥 기회", variant: "secondary" as const };
}

type Props = {
  data: MvrvData;
  resetRef?: React.RefObject<(() => void) | null>;
};

export function MvrvZScoreChart({ data, resetRef }: Props) {
  const { containerRef, resetView } = useChart(
    (chart) => {
      const lineSeries = chart.addSeries(LineSeries, {
        color: "#3b82f6",
        lineWidth: 2,
        priceLineVisible: false,
      });
      lineSeries.setData(data.zScore);
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
    [data.zScore],
  );

  useEffect(() => {
    if (resetRef) resetRef.current = resetView;
  }, [resetRef, resetView]);

  const current = data.zScore[data.zScore.length - 1]?.value;
  const status = current != null ? getZScoreStatus(current) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-muted-foreground text-sm font-medium">
          MVRV Z-Score
        </CardTitle>
        {current != null && status && (
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold">{current.toFixed(2)}</span>
            <Badge variant={status.variant} className="mb-1">
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

export function MvrvZScoreChartSkeleton() {
  return (
    <ChartSkeleton>
      <div className="flex items-end gap-2">
        <Skeleton className="h-9 w-16" />
        <Skeleton className="mb-1 h-5 w-14 rounded-full" />
      </div>
    </ChartSkeleton>
  );
}
