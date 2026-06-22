"use client";

import { useEffect } from "react";
import { LineSeries, LineStyle } from "lightweight-charts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer } from "@/components/chart-container";
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
  data?: MvrvData;
  resetRef?: React.RefObject<(() => void) | null>;
  updatedLabel?: string;
};

export function MvrvZScoreChart({ data, resetRef, updatedLabel }: Props) {
  const { containerRef, resetView } = useChart(
    (chart) => {
      if (!data) return;
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
    [data],
  );

  useEffect(() => {
    if (resetRef) resetRef.current = resetView;
  }, [resetRef, resetView]);

  const current = data?.zScore[data.zScore.length - 1]?.value;
  const status = current != null ? getZScoreStatus(current) : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-muted-foreground text-sm font-medium">MVRV Z-Score</CardTitle>
          {updatedLabel && <span className="text-muted-foreground text-xs">{updatedLabel}</span>}
        </div>
        {!data ? (
          <Skeleton className="h-9 w-20" />
        ) : (
          current != null && status && (
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold">{current.toFixed(2)}</span>
              <Badge variant={status.variant} className="mb-1">{status.label}</Badge>
            </div>
          )
        )}
      </CardHeader>
      <CardContent className="p-0">
        {!data ? (
          <Skeleton className="h-[280px] w-full rounded-none" />
        ) : (
          <ChartContainer containerRef={containerRef} onReset={resetView} />
        )}
        <p className="bg-muted/50 text-muted-foreground px-6 pt-3 pb-4 text-xs">
          시장가치(MV)와 실현가치(RV)의 괴리를 표준편차로 환산한 지표. 7 이상은 사이클 천장 과열, 0 미만은 역사적 바닥 매수 구간을 의미합니다.
        </p>
      </CardContent>
    </Card>
  );
}
