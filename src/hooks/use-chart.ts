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
export {
  AreaSeries,
  LineSeries,
  LineStyle,
  createSeriesMarkers,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from 'lightweight-charts';

// 차트는 canvas에 그려져 CSS 변수(--border 등)가 통하지 않는다. 테마별 색을 값으로 들고 있다가
// resolvedTheme에 따라 골라 쓴다. 마운트 전에는 resolvedTheme이 undefined이므로 다크로 시작한다.
const CHART_CHROME = {
  dark: { text: '#9ca3af', grid: '#1f2937', border: '#374151', crosshair: '#6b7280' },
  light: { text: '#6b7280', grid: '#e5e7eb', border: '#d1d5db', crosshair: '#9ca3af' },
} as const;

/*
 * 차트 선·기준선 팔레트. 캔버스가 CSS 변수를 못 받아서, 색 두 축(CLAUDE.md 「색은 두 축」)의 토큰을
 * 같은 값의 hex로 들고 있다. 정본은 globals.css의 oklch 토큰이고 이 표는 손으로 맞춘 사본이라,
 * 토큰을 바꾸면 여기도 함께 바꾼다(oklch → sRGB 변환값. 지금 값은 Tailwind v4 팔레트와 같다).
 * 차트 컴포넌트는 hex를 직접 적지 않고 여기서 고른다. 고르는 기준은 DOM과 같다.
 *
 * - 판정(CHART_TONE): 좋고 나쁨의 뜻이 있는 자리. 기준선의 "고평가·저평가", 천장 신호 표식.
 *   모드와 무관한 `--*-surface` 값을 쓴다. 기준선 표를 모듈 상수로 둘 수 있고, 중간 명도라 두 배경에서 다 보인다.
 * - 계열(CHART_SERIES): 여럿을 구분하거나 주제를 칠할 뿐 뜻이 없는 자리. 한 차트 안의 여러 선,
 *   카드마다 다른 선 색. 판정색을 여기에 쓰면 선이 "나쁜 선·좋은 선"으로 읽힌다. 넷을 넘으면 되풀이한다.
 *
 * 둘 밖의 색: BTC 브랜드 색은 `BTC_COLOR`(src/lib/utils.ts), 무지개 밴드와 공포·탐욕 척도는
 * 판정도 계열도 아닌 척도라 각자의 표(bitcoin-models.ts의 RAINBOW_BANDS, fear-greed-chart.tsx)에 둔다.
 */
export const CHART_TONE = {
  good: '#00bc7d', // --good-surface
  bad: '#ff2056', // --bad-surface
  warn: '#fe9a00', // --warn-surface
} as const;

export const CHART_SERIES = [
  '#00a6f4', // --series-1
  '#8e51ff', // --series-2
  '#e12afb', // --series-3
  '#2b7fff', // --series-4
] as const;

/** 지표를 얹을 바탕이 되는 무채색 선(지표 차트 뒤의 가격선). 테마와 무관하게 두 배경에서 다 보이는 회색. */
export const CHART_MUTED = '#6b7280';

/** 여러 색 위에 겹치는 선(무지개 밴드 위의 가격선). 배경과 가장 먼 무채색이라 테마마다 다르다. */
export const chartInk = (isDark: boolean) => (isDark ? '#ffffff' : '#111827');

/**
 * 차트 시리즈 색을 테마에 맞춰 고를 때 쓴다(밝은 배경에서 안 보이는 흰 선 등).
 * useChart가 isDark를 자기 deps에 이미 넣으므로 테마가 바뀌면 차트가 다시 만들어진다.
 * 이 값을 쓰는 컴포넌트가 useChart의 deps에 따로 넣지 않아도 된다.
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
      // 깨운 차트 위에서도 세로로 넘기려는 손짓은 페이지에 흘려보낸다. 첫 조작은
      // ChartContainer의 오버레이가 막고, 이건 깨운 뒤를 맡는다. 확대는 핀치로 한다.
      handleScroll: { vertTouchDrag: false },
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
