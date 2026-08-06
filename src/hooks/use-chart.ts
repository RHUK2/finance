'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import {
  ColorType,
  LineStyle,
  PriceScaleMode,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type SeriesType,
} from 'lightweight-charts';

// 차트 컴포넌트가 lightweight-charts를 직접 import하지 않도록 여기서 재수출한다 (단일 관문).
export { AreaSeries, LineSeries, LineStyle, createSeriesMarkers, type Time } from 'lightweight-charts';

// 차트는 canvas에 그려져 CSS 변수(--border 등)가 통하지 않는다. 테마별 색을 값으로 들고 있다가
// resolvedTheme에 따라 골라 쓴다. 마운트 전에는 resolvedTheme이 undefined이므로 다크로 시작한다.
const CHART_CHROME = {
  dark: { text: '#9ca3af', grid: '#1f2937', border: '#374151', crosshair: '#6b7280' },
  light: { text: '#6b7280', grid: '#e5e7eb', border: '#d1d5db', crosshair: '#9ca3af' },
} as const;

/**
 * 차트 시리즈 색을 테마에 맞춰 고를 때 쓴다(밝은 배경에서 안 보이는 흰 선 등).
 * 이 값을 쓰는 컴포넌트는 useChart의 deps에도 넣어 테마 전환 시 다시 그려지게 할 것.
 */
export function useIsDarkChart(): boolean {
  const { resolvedTheme } = useTheme();
  return resolvedTheme !== 'light';
}

// 지표 차트 공용. 기준선(존 경계)을 점선 price line으로 추가.
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
  /** "전체 스케일 초기화" 버튼 연동용. resetView를 밖에서 호출할 수 있게 담아준다. */
  resetRef?: React.RefObject<(() => void) | null>;
};

export function useChart(
  setup: (chart: IChartApi) => void,
  deps: React.DependencyList,
  { height = 280, logScale = false, timeVisible = false, resetRef }: ChartOverrides = {},
) {
  const isDark = useIsDarkChart();
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const setupRef = useRef(setup);
  const dirtyRef = useRef(false);
  // eslint-disable-next-line react-hooks/refs
  setupRef.current = setup;

  const resetView = useCallback(() => {
    if (!dirtyRef.current) return;
    dirtyRef.current = false;
    chartRef.current?.priceScale('right').applyOptions({ autoScale: true });
    chartRef.current?.timeScale().fitContent();
  }, []);

  useEffect(() => {
    if (resetRef) resetRef.current = resetView;
  }, [resetRef, resetView]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    dirtyRef.current = false;

    const chrome = isDark ? CHART_CHROME.dark : CHART_CHROME.light;
    const chart = createChart(container, {
      autoSize: true,
      height,
      hoveredSeriesOnTop: false,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: chrome.text,
      },
      grid: {
        vertLines: { color: chrome.grid },
        horzLines: { color: chrome.grid },
      },
      rightPriceScale: {
        borderColor: chrome.border,
        ...(logScale && { mode: PriceScaleMode.Logarithmic }),
      },
      timeScale: {
        borderColor: chrome.border,
        minBarSpacing: 0.1,
        ...(timeVisible && { timeVisible: true }),
      },
      crosshair: {
        vertLine: { color: chrome.crosshair },
        horzLine: { color: chrome.crosshair },
      },
    });

    chartRef.current = chart;
    setupRef.current(chart);

    const markDirty = () => {
      dirtyRef.current = true;
    };
    container.addEventListener('wheel', markDirty, { passive: true });
    container.addEventListener('pointerdown', markDirty, { passive: true });

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
      container.removeEventListener('wheel', markDirty);
      container.removeEventListener('pointerdown', markDirty);
      chart.remove();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height, logScale, timeVisible, isDark, ...deps]);

  return { containerRef, resetView };
}
