"use client";

import { ChartContainer } from "@/components/chart-container";
import { LineSeries, useChart } from "@/hooks/use-chart";
import type { HashrateHistoryData } from "@/hooks/use-mempool";
import { BTC_COLOR } from "@/lib/utils";

type Props = {
  data: HashrateHistoryData;
};

export function HashrateChart({ data }: Props) {
  const { containerRef, resetView } = useChart(
    (chart) => {
      const series = chart.addSeries(LineSeries, {
        color: BTC_COLOR,
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
