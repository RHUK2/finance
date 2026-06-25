"use client";

import { useEffect } from "react";
import { ChartContainer } from "@/components/chart-container";
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
  data?: FearGreedData;
  resetRef?: React.RefObject<(() => void) | null>;
  updatedLabel?: string;
};

export function FearGreedChart({ data, resetRef, updatedLabel }: Props) {
  const { containerRef, resetView } = useChart(
    (chart) => {
      if (!data) return;
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
    [data],
    { timeVisible: true },
  );

  useEffect(() => {
    if (resetRef) resetRef.current = resetView;
  }, [resetRef, resetView]);

  const info = data
    ? (CLASSIFICATIONS[data.classification] ?? {
        label: data.classification,
        color: "text-foreground",
      })
    : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            공포 & 탐욕 지수
          </CardTitle>
          {updatedLabel && (
            <span className="text-muted-foreground text-xs">
              {updatedLabel}
            </span>
          )}
        </div>
        {!data ? (
          <Skeleton className="h-9 w-20" />
        ) : (
          <div className="flex items-end gap-2">
            <span className={cn("text-3xl font-bold", info!.color)}>
              {data.value}
            </span>
            <span className={cn("mb-1 text-sm font-medium", info!.color)}>
              {info!.label}
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {!data ? (
          <Skeleton className="h-[280px] w-full rounded-none" />
        ) : (
          <ChartContainer containerRef={containerRef} onReset={resetView} />
        )}
        <p className="bg-muted/50 text-muted-foreground px-6 pt-3 pb-4 text-xs">
          시장 심리를 0~100으로 수치화한 지표. 숫자보다 &lsquo;극단&rsquo;을
          역발상 신호로 읽는 것이 핵심 — 0~25(극도의 공포)는 과매도로 분할 매수
          기회, 75~100(극도의 탐욕)은 과열로 차익실현·리스크 관리 신호로
          해석합니다.
        </p>
      </CardContent>
    </Card>
  );
}
