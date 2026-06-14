"use client";

import { LineSeries, LineStyle } from "lightweight-charts";
import { RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartSkeleton } from "@/components/chart-skeleton";
import { useChart } from "@/hooks/use-chart";
import type { MvrvData } from "@/hooks/use-crypto";

const ZONE_LINES = [
  { price: 1, label: "극도 저평가", color: "#ef4444" },
  { price: 2, label: "저평가", color: "#f97316" },
  { price: 3.5, label: "적정", color: "#22c55e" },
  { price: 7, label: "버블 위험", color: "#eab308" },
];

function getMvrvStatus(value: number) {
  if (value < 1)
    return { label: "극도 저평가", variant: "destructive" as const };
  if (value < 2) return { label: "저평가", variant: "secondary" as const };
  if (value < 3.5) return { label: "적정", variant: "outline" as const };
  if (value < 7) return { label: "고평가", variant: "secondary" as const };
  return { label: "버블 위험", variant: "destructive" as const };
}

type Props = {
  data: MvrvData;
};

export function MvrvChart({ data }: Props) {
  const { containerRef, resetView } = useChart(
    (chart) => {
      const lineSeries = chart.addSeries(LineSeries, {
        color: "#3b82f6",
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

  const status = getMvrvStatus(data.value);
  const date = new Date(data.date).toLocaleDateString("ko-KR");

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            MVRV Z-Score
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
          시가총액 ÷ 실현가치 · {date} 기준
        </p>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold">{data.value.toFixed(2)}</span>
          <Badge variant={status.variant} className="mb-1">
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 pb-4">
        <div ref={containerRef} />
      </CardContent>
    </Card>
  );
}

export function MvrvChartSkeleton() {
  return <ChartSkeleton subtitleClassName="w-40" valueClassName="h-9 w-32" />;
}
