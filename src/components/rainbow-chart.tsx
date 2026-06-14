"use client";

import { useMemo } from "react";
import { AreaSeries, LineSeries } from "lightweight-charts";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartSkeleton } from "@/components/chart-skeleton";
import { useChart } from "@/hooks/use-chart";
import {
  RAINBOW_BANDS,
  daysSinceGenesis,
  generateModelDates,
  powerLawPrice,
} from "@/lib/bitcoin-models";
import type { BitcoinHistoricalData } from "@/hooks/use-crypto";

type Props = {
  data: BitcoinHistoricalData;
};

export function RainbowChart({ data }: Props) {
  const bandData = useMemo(() => {
    const twoYearsLater = new Date(Date.now() + 2 * 365 * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const dates = generateModelDates("2012-01-01", twoYearsLater, 14);
    return RAINBOW_BANDS.map((band) =>
      dates.flatMap((time) => {
        const value = powerLawPrice(daysSinceGenesis(time)) * band.upper;
        return value >= 0.01 ? [{ time, value }] : [];
      }),
    );
  }, []);

  const { containerRef, resetView } = useChart(
    (chart) => {
      for (let i = RAINBOW_BANDS.length - 1; i >= 0; i--) {
        const band = RAINBOW_BANDS[i];
        const series = chart.addSeries(AreaSeries, {
          lineColor: band.color,
          lineWidth: 1,
          topColor: band.color,
          bottomColor: band.color,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });
        series.setData(bandData[i]);
      }
      const priceSeries = chart.addSeries(LineSeries, {
        color: "#ffffff",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
      });
      priceSeries.setData(data.history);
    },
    [data.history, bandData],
    { height: 320, logScale: true },
  );

  const currentBand = useMemo(() => {
    if (!data.history.length) return null;
    const latest = data.history[data.history.length - 1];
    const ratio = latest.value / powerLawPrice(daysSinceGenesis(latest.time));
    return (
      RAINBOW_BANDS.find((b) => ratio < b.upper) ??
      RAINBOW_BANDS[RAINBOW_BANDS.length - 1]
    );
  }, [data.history]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            레인보우 차트
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
          Power Law 기반 9단계 밸류에이션 밴드
        </p>
        {currentBand && (
          <span
            className="text-sm font-semibold"
            style={{ color: currentBand.color }}
          >
            {currentBand.label}
          </span>
        )}
      </CardHeader>
      <CardContent className="p-0 pb-4">
        <div ref={containerRef} />
      </CardContent>
    </Card>
  );
}

export function RainbowChartSkeleton() {
  return (
    <ChartSkeleton
      chartHeight={320}
      subtitleClassName="w-48"
      valueClassName="h-4 w-16"
    />
  );
}
