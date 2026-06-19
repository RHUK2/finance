"use client";

import { LineSeries } from "lightweight-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer } from "@/components/chart-container";
import { useChart } from "@/hooks/use-chart";
import { useEffect } from "react";

export type MacroLine = {
  label?: string;
  data: { time: string; value: number }[];
  color: string;
};

type Props = {
  title: string;
  currentLabel?: string;
  changePercent?: number | null;
  lines?: MacroLine[];
  updatedLabel?: string;
  resetRef?: React.RefObject<(() => void) | null>;
  description?: string;
};

export function MacroChart({ title, currentLabel, changePercent, lines, updatedLabel, resetRef, description }: Props) {
  const { containerRef, resetView } = useChart(
    (chart) => {
      if (!lines) return;
      lines.forEach((line) => {
        const series = chart.addSeries(LineSeries, {
          color: line.color,
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: true,
          ...(line.label ? { title: line.label } : {}),
        });
        series.setData(line.data);
      });
    },
    [lines],
    { height: 240 },
  );

  useEffect(() => {
    if (resetRef) resetRef.current = resetView;
  }, [resetRef, resetView]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-muted-foreground text-sm font-medium">{title}</CardTitle>
          {updatedLabel && <span className="text-muted-foreground text-xs">{updatedLabel}</span>}
        </div>
        {!lines ? (
          <Skeleton className="h-8 w-32" />
        ) : (
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold">{currentLabel}</span>
            {changePercent != null && (
              <span className={`mb-1 text-sm font-semibold ${changePercent >= 0 ? "text-green-400" : "text-red-400"}`}>
                {changePercent >= 0 ? "▲" : "▼"} {Math.abs(changePercent)}%
              </span>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {!lines ? (
          <Skeleton className="h-[240px] w-full rounded-none" />
        ) : (
          <ChartContainer containerRef={containerRef} onReset={resetView} />
        )}
        {description ? (
          <p className="bg-muted/50 text-muted-foreground border-t px-6 pt-3 pb-4 text-xs">{description}</p>
        ) : (
          <div className="h-4" />
        )}
      </CardContent>
    </Card>
  );
}
