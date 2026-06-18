"use client";

import { LineSeries } from "lightweight-charts";
import { ChartContainer } from "@/components/chart-container";
import { useChart } from "@/hooks/use-chart";
import type { HashrateHistoryData } from "@/hooks/use-mempool";

type Props = {
  data: HashrateHistoryData;
};

export function HashrateChart({ data }: Props) {
  const { containerRef, resetView } = useChart(
    (chart) => {
      const series = chart.addSeries(LineSeries, {
        color: "#f7931a",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
        title: "EH/s",
      });
      series.setData(data.history);
    },
    [data.history],
    { height: 240 },
  );

  return <ChartContainer containerRef={containerRef} onReset={resetView} />;
}
