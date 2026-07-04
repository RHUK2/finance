"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  ColorType,
  LineStyle,
  PriceScaleMode,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type SeriesType,
} from "lightweight-charts";

// 차트 컴포넌트가 lightweight-charts를 직접 import하지 않도록 여기서 재수출한다 (단일 관문).
export {
  AreaSeries,
  LineSeries,
  LineStyle,
  createSeriesMarkers,
  type Time,
} from "lightweight-charts";

// 지표 차트 공용 — 기준선(존 경계)을 점선 price line으로 추가.
export function addZoneLines(
  series: ISeriesApi<SeriesType>,
  zones: readonly { price: number; label: string; color: string }[],
) {
  zones.forEach((zone) => {
    series.createPriceLine({
      price: zone.price,
      color: zone.color,
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: zone.label,
    });
  });
}

type ChartOverrides = {
  height?: number;
  logScale?: boolean;
  timeVisible?: boolean;
  /** "전체 스케일 초기화" 버튼 연동용 — resetView를 밖에서 호출할 수 있게 담아준다. */
  resetRef?: React.RefObject<(() => void) | null>;
};

export function useChart(
  setup: (chart: IChartApi) => void,
  deps: React.DependencyList,
  {
    height = 280,
    logScale = false,
    timeVisible = false,
    resetRef,
  }: ChartOverrides = {},
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
    if (resetRef) resetRef.current = resetView;
  }, [resetRef, resetView]);

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
