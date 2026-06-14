"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  ColorType,
  PriceScaleMode,
  createChart,
  type IChartApi,
} from "lightweight-charts";

type ChartOverrides = {
  height?: number;
  logScale?: boolean;
  timeVisible?: boolean;
};

export function useChart(
  setup: (chart: IChartApi) => void,
  deps: React.DependencyList,
  { height = 280, logScale = false, timeVisible = false }: ChartOverrides = {},
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const setupRef = useRef(setup);
  setupRef.current = setup;

  const resetView = useCallback(() => {
    chartRef.current?.timeScale().fitContent();
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "#1f2937" },
        horzLines: { color: "#1f2937" },
      },
      rightPriceScale: {
        borderColor: "#374151",
        ...(logScale && { mode: PriceScaleMode.Logarithmic }),
      },
      timeScale: {
        borderColor: "#374151",
        minBarSpacing: 0.1,
        ...(timeVisible && { timeVisible: true }),
      },
      crosshair: {
        vertLine: { color: "#6b7280" },
        horzLine: { color: "#6b7280" },
      },
    });

    chartRef.current = chart;
    setupRef.current(chart);

    const rafId = requestAnimationFrame(() => {
      chart.timeScale().fitContent();
    });

    return () => {
      cancelAnimationFrame(rafId);
      chart.remove();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height, logScale, timeVisible, ...deps]);

  return { containerRef, resetView };
}
