"use client";

import { useEffect, useMemo } from "react";
import { LineSeries, LineStyle } from "lightweight-charts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer } from "@/components/chart-container";
import { useChart } from "@/hooks/use-chart";
import { dailyIssuanceBtc, movingAverage } from "@/lib/bitcoin-models";
import type { BitcoinHistoricalData } from "@/hooks/use-crypto";

const ZONE_LINES = [
  { price: 4, label: "고평가", color: "#ef4444" },
  { price: 0.5, label: "저평가", color: "#22c55e" },
];

function getPuellStatus(value: number) {
  if (value >= 4) return { label: "고평가", variant: "destructive" as const };
  if (value >= 1.5)
    return { label: "다소 높음", variant: "secondary" as const };
  if (value >= 0.5) return { label: "적정", variant: "outline" as const };
  return { label: "저평가 (채굴자 항복)", variant: "secondary" as const };
}

type Props = {
  data?: BitcoinHistoricalData;
  resetRef?: React.RefObject<(() => void) | null>;
  updatedLabel?: string;
};

export function PuellMultipleChart({ data, resetRef, updatedLabel }: Props) {
  const puell = useMemo(() => {
    if (!data) return [];
    const issuanceUsd = data.history.map((p) => ({
      time: p.time,
      value: p.value * dailyIssuanceBtc(p.time),
    }));
    const ma365 = movingAverage(issuanceUsd, 365);
    const maMap = new Map(ma365.map((p) => [p.time, p.value]));
    return issuanceUsd.flatMap((p) => {
      const ma = maMap.get(p.time);
      return ma ? [{ time: p.time, value: p.value / ma }] : [];
    });
  }, [data]);

  const { containerRef, resetView } = useChart(
    (chart) => {
      const lineSeries = chart.addSeries(LineSeries, {
        color: "#f59e0b",
        lineWidth: 2,
        priceLineVisible: false,
      });
      lineSeries.setData(puell);
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
    [puell],
  );

  useEffect(() => {
    if (resetRef) resetRef.current = resetView;
  }, [resetRef, resetView]);

  const current = puell[puell.length - 1]?.value;
  const status = current != null ? getPuellStatus(current) : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Puell Multiple
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
          채굴자의 일일 수익을 1년 평균으로 나눈 값. 4 이상이면 채굴자 매도
          압력이 극대화된 과열 구간, 0.5 미만이면 채굴자 항복으로 인한 바닥
          신호입니다.
        </p>
      </CardContent>
    </Card>
  );
}
