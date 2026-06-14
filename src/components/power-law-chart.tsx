"use client";

import { LineSeries, LineStyle } from "lightweight-charts";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartSkeleton } from "@/components/chart-skeleton";
import { useChart } from "@/hooks/use-chart";
import {
  daysSinceGenesis,
  generateModelDates,
  powerLawPrice,
} from "@/lib/bitcoin-models";
import type { BitcoinHistoricalData } from "@/hooks/use-crypto";

const _twoYearsLater = new Date(Date.now() + 2 * 365 * 86_400_000)
  .toISOString()
  .slice(0, 10);
const _dates = generateModelDates("2012-01-01", _twoYearsLater, 7);
const _make = (mult: number) =>
  _dates.flatMap((time) => {
    const value = powerLawPrice(daysSinceGenesis(time)) * mult;
    return value >= 0.01 ? [{ time, value }] : [];
  });
const MODEL_LINES = { center: _make(1), upper: _make(5), lower: _make(0.2) };

type Props = {
  data: BitcoinHistoricalData;
};

export function PowerLawChart({ data }: Props) {
  const { containerRef, resetView } = useChart(
    (chart) => {
      const upperSeries = chart.addSeries(LineSeries, {
        color: "#ef4444",
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      upperSeries.setData(MODEL_LINES.upper);

      const lowerSeries = chart.addSeries(LineSeries, {
        color: "#22c55e",
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      lowerSeries.setData(MODEL_LINES.lower);

      const centerSeries = chart.addSeries(LineSeries, {
        color: "#a78bfa",
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
        title: "모델",
      });
      centerSeries.setData(MODEL_LINES.center);

      const priceSeries = chart.addSeries(LineSeries, {
        color: "#f59e0b",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
        title: "BTC",
      });
      priceSeries.setData(data.history);
    },
    [data.history],
    { height: 320, logScale: true },
  );

  const latest = data.history[data.history.length - 1];
  const modelNow = latest ? powerLawPrice(daysSinceGenesis(latest.time)) : null;
  const ratio = latest && modelNow ? latest.value / modelNow : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Power Law 모델
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
          로그 회귀 공정가치 (보라 점선) · 5× 상단 / 0.2× 하단 밴드
        </p>
        {ratio != null && (
          <span
            className="text-sm font-semibold"
            style={{ color: ratio > 1 ? "#f97316" : "#22c55e" }}
          >
            모델 대비 {ratio > 1 ? "+" : ""}
            {((ratio - 1) * 100).toFixed(0)}%
          </span>
        )}
      </CardHeader>
      <CardContent className="p-0 pb-4">
        <div ref={containerRef} />
      </CardContent>
    </Card>
  );
}

export function PowerLawChartSkeleton() {
  return (
    <ChartSkeleton
      chartHeight={320}
      subtitleClassName="w-64"
      valueClassName="h-4 w-20"
    />
  );
}
