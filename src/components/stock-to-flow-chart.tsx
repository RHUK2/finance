"use client";

import { useEffect, useMemo } from "react";
import {
  LineSeries,
  LineStyle,
  createSeriesMarkers,
  type Time,
} from "lightweight-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer } from "@/components/chart-container";
import { useChart } from "@/hooks/use-chart";
import { HALVING_DATES, s2fModelPrice, s2fRatio } from "@/lib/bitcoin-models";
import type { BitcoinHistoricalData } from "@/hooks/use-crypto";

type Props = {
  data?: BitcoinHistoricalData;
  resetRef?: React.RefObject<(() => void) | null>;
  updatedLabel?: string;
};

export function StockToFlowChart({ data, resetRef, updatedLabel }: Props) {
  const modelData = useMemo(
    () =>
      data
        ? data.history.flatMap(({ time }) => {
            const value = s2fModelPrice(time);
            return value >= 1 ? [{ time, value }] : [];
          })
        : [],
    [data],
  );

  const { containerRef, resetView } = useChart(
    (chart) => {
      if (!data) return;
      const modelSeries = chart.addSeries(LineSeries, {
        color: "#f59e0b",
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false,
        lastValueVisible: true,
        title: "S2F",
      });
      modelSeries.setData(modelData);

      const priceSeries = chart.addSeries(LineSeries, {
        color: "#3b82f6",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
        title: "BTC",
      });
      priceSeries.setData(data.history);

      const markers = HALVING_DATES.filter(
        (d) => d >= (data.history[0]?.time ?? ""),
      ).map((date, i) => ({
        time: date as Time,
        position: "belowBar" as const,
        color: "#f59e0b",
        shape: "arrowUp" as const,
        text: `반감기 ${i + 1}`,
      }));
      if (markers.length) createSeriesMarkers(priceSeries, markers);
    },
    [data, modelData],
    { height: 320, logScale: true },
  );

  useEffect(() => {
    if (resetRef) resetRef.current = resetView;
  }, [resetRef, resetView]);

  const latest = data?.history[data.history.length - 1];
  const s2f = latest ? s2fRatio(latest.time) : null;
  const modelPrice = latest ? s2fModelPrice(latest.time) : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-muted-foreground text-sm font-medium">Stock-to-Flow 모델</CardTitle>
          {updatedLabel && <span className="text-muted-foreground text-xs">{updatedLabel}</span>}
        </div>
        {!data ? (
          <Skeleton className="h-5 w-40" />
        ) : (
          <div className="flex items-center gap-3">
            {modelPrice != null && (
              <span className="text-sm font-semibold text-amber-400">
                모델 ${modelPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </span>
            )}
            {latest && (
              <span className="text-muted-foreground text-sm">
                실제 ${latest.value.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </span>
            )}
            {s2f != null && (
              <span className="text-muted-foreground text-xs">S2F {s2f.toFixed(1)}</span>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {!data ? (
          <Skeleton className="h-[320px] w-full rounded-none" />
        ) : (
          <ChartContainer containerRef={containerRef} onReset={resetView} />
        )}
        <p className="bg-muted/50 text-muted-foreground border-t px-6 pt-3 pb-4 text-xs">
          유통량 대비 신규 공급량의 희소성 비율(S2F)로 가격을 예측하는 모델. 반감기마다 공급이 절반으로 줄어들면서 가격이 오른다는 공급 측면의 논리를 시각화합니다.
        </p>
      </CardContent>
    </Card>
  );
}
