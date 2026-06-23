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
  const dirtyRef = useRef(false);
  // eslint-disable-next-line react-hooks/refs
  setupRef.current = setup;

  const resetView = useCallback(() => {
    if (!dirtyRef.current) return;
    dirtyRef.current = false;
    chartRef.current?.priceScale("right").applyOptions({ autoScale: true });
    chartRef.current?.timeScale().fitContent();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    dirtyRef.current = false;

    const chart = createChart(container, {
      autoSize: true,
      height,
      hoveredSeriesOnTop: false,
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

    const markDirty = () => {
      dirtyRef.current = true;
    };
    container.addEventListener("wheel", markDirty, { passive: true });
    container.addEventListener("pointerdown", markDirty, { passive: true });

    let resizeObserver: ResizeObserver | null = null;
    const rafId = requestAnimationFrame(() => {
      chart.timeScale().fitContent();
      resizeObserver = new ResizeObserver(() => {
        if (!dirtyRef.current) {
          chartRef.current?.timeScale().fitContent();
        }
      });
      resizeObserver.observe(container);
    });

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      container.removeEventListener("wheel", markDirty);
      container.removeEventListener("pointerdown", markDirty);
      chart.remove();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height, logScale, timeVisible, ...deps]);

  return { containerRef, resetView };
}
