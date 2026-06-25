"use client";

import { useEffect, useMemo } from "react";
import { LineSeries, LineStyle } from "lightweight-charts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer } from "@/components/chart-container";
import { useChart } from "@/hooks/use-chart";
import { movingAverage } from "@/lib/bitcoin-models";
import type { BitcoinHistoricalData } from "@/hooks/use-crypto";

const ZONE_LINES = [
  { price: 2.4, label: "과열", color: "#ef4444" },
  { price: 1, label: "저평가", color: "#22c55e" },
];

function getMayerStatus(value: number) {
  if (value >= 2.4) return { label: "과열", variant: "destructive" as const };
  if (value >= 1.5) return { label: "고평가", variant: "secondary" as const };
  if (value >= 1) return { label: "적정", variant: "outline" as const };
  return { label: "저평가", variant: "secondary" as const };
}

type Props = {
  data?: BitcoinHistoricalData;
  resetRef?: React.RefObject<(() => void) | null>;
  updatedLabel?: string;
};

export function MayerMultipleChart({ data, resetRef, updatedLabel }: Props) {
  const mayer = useMemo(() => {
    if (!data) return [];
    const sma = movingAverage(data.history, 200);
    const smaMap = new Map(sma.map((p) => [p.time, p.value]));
    return data.history.flatMap((p) => {
      const ma = smaMap.get(p.time);
      return ma ? [{ time: p.time, value: p.value / ma }] : [];
    });
  }, [data]);

  const { containerRef, resetView } = useChart(
    (chart) => {
      const lineSeries = chart.addSeries(LineSeries, {
        color: "#a78bfa",
        lineWidth: 2,
        priceLineVisible: false,
      });
      lineSeries.setData(mayer);
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
    [mayer],
  );

  useEffect(() => {
    if (resetRef) resetRef.current = resetView;
  }, [resetRef, resetView]);

  const current = mayer[mayer.length - 1]?.value;
  const status = current != null ? getMayerStatus(current) : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Mayer Multiple
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
          current != null &&
          status && (
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold">{current.toFixed(2)}</span>
              <Badge variant={status.variant} className="mb-1">
                {status.label}
              </Badge>
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
          현재 가격 ÷ 200일 이동평균. 1을 기준선으로 읽습니다 — 1 미만이면 장기
          추세 아래의 저평가, 2.4 이상이면 추세를 크게 벗어난 단기 과열로 보고
          사이클 내 진입·청산 타이밍을 가늠합니다.
        </p>
      </CardContent>
    </Card>
  );
}
