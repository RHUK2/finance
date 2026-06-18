"use client";

import { useEffect, useMemo } from "react";
import { LineSeries, LineStyle } from "lightweight-charts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartSkeleton } from "@/components/chart-skeleton";
import { ChartContainer } from "@/components/chart-container";
import { Skeleton } from "@/components/ui/skeleton";
import { useChart } from "@/hooks/use-chart";
import { dailyIssuanceBtc, movingAverage } from "@/lib/bitcoin-models";
import type { BitcoinHistoricalData } from "@/hooks/use-crypto";

const ZONE_LINES = [
  { price: 4, label: "고평가", color: "#ef4444" },
  { price: 0.5, label: "저평가", color: "#22c55e" },
];

function getPuellStatus(value: number) {
  if (value >= 4) return { label: "고평가", variant: "destructive" as const };
  if (value >= 1.5) return { label: "다소 높음", variant: "secondary" as const };
  if (value >= 0.5) return { label: "적정", variant: "outline" as const };
  return { label: "저평가 (채굴자 항복)", variant: "secondary" as const };
}

type Props = {
  data: BitcoinHistoricalData;
  resetRef?: React.RefObject<(() => void) | null>;
};

export function PuellMultipleChart({ data, resetRef }: Props) {
  const puell = useMemo(() => {
    // 일일 채굴자 수익(USD) = 가격 × 일일 발행량(BTC)
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
  }, [data.history]);

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
        <CardTitle className="text-muted-foreground text-sm font-medium">
          Puell Multiple
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

export function PuellMultipleChartSkeleton() {
  return (
    <ChartSkeleton>
      <div className="flex items-end gap-2">
        <Skeleton className="h-9 w-16" />
        <Skeleton className="mb-1 h-5 w-14 rounded-full" />
      </div>
    </ChartSkeleton>
  );
}
