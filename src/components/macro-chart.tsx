"use client";

import { LineSeries } from "lightweight-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartSkeleton } from "@/components/chart-skeleton";
import { ChartContainer } from "@/components/chart-container";
import { Skeleton } from "@/components/ui/skeleton";
import { useChart } from "@/hooks/use-chart";

export type MacroLine = {
  label?: string;
  data: { time: string; value: number }[];
  color: string;
};

type Props = {
  title: string;
  currentLabel: string;
  changePercent: number | null;
  lines: MacroLine[];
};

export function MacroChart({ title, currentLabel, changePercent, lines }: Props) {
  const { containerRef, resetView } = useChart(
    (chart) => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {title}
        </CardTitle>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold">{currentLabel}</span>
          {changePercent != null && (
            <span
              className={`mb-1 text-sm font-semibold ${
                changePercent >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {changePercent >= 0 ? "▲" : "▼"} {Math.abs(changePercent)}%
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ChartContainer containerRef={containerRef} onReset={resetView} />
        <div className="h-4" />
      </CardContent>
    </Card>
  );
}

export function MacroChartSkeleton() {
  return (
    <ChartSkeleton chartHeight={240}>
      <div className="flex items-end gap-2">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="mb-1 h-4 w-12" />
      </div>
    </ChartSkeleton>
  );
}
