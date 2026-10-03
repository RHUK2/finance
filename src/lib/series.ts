import { pctChange } from './utils';

// 로더(src/lib/loaders/) 응답과 클라이언트 훅이 공유하는 시계열 요약 형태.
export type MacroSeries = {
  history: { time: string; value: number }[];
  current: number | null;
  changePercent: number | null;
};

/**
 * 같은 날짜가 여러 번 담긴 시계열에서 첫 관측만 남긴다. 외부 API가 일자 경계에서
 * 중복 포인트를 주는 경우(mempool.space 해시레이트, CoinMetrics 등)에 쓴다.
 */
export function dedupeByTime<T extends { time: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (seen.has(row.time)) return false;
    seen.add(row.time);
    return true;
  });
}

/** 히스토리에서 현재값·직전 대비 변화율을 계산해 MacroSeries로 감싼다. */
export function toMacroSeries(history: { time: string; value: number }[]): MacroSeries {
  const last = history[history.length - 1];
  const prev = history[history.length - 2];
  return {
    history,
    current: last?.value ?? null,
    changePercent: last && prev ? pctChange(last.value, prev.value) : null,
  };
}

/** 실시간 시세 한 점. `time`은 그 시세가 속한 일봉의 날짜(YYYY-MM-DD)라 히스토리의 날짜와 같은 축이다. */
export type LivePoint = { time: string; value: number };

/**
 * 하루 한 번 받는 일봉 히스토리 끝에 실시간 시세 한 점을 얹는다. 같은 날이면 마지막 봉을 바꾸고
 * 다음 날이면 붙인다. 시세가 히스토리보다 이르면(장이 닫힌 뒤 히스토리가 먼저 갱신된 경우 등) 버린다.
 * 차트의 `series.update`가 받는 규칙과 같아서, 화면 숫자와 차트 끝점이 같은 판정을 따른다.
 */
export function withLivePoint<T extends { time: string; value: number }>(
  history: T[],
  live: LivePoint | null | undefined,
): { time: string; value: number }[] {
  const last = history[history.length - 1];
  if (!live || (last && live.time < last.time)) return history;
  if (last && live.time === last.time) return [...history.slice(0, -1), live];
  return [...history, live];
}

/** `withLivePoint`를 얹은 뒤 현재값·전일 대비를 다시 계산한다. */
export function withLive(series: MacroSeries, live: LivePoint | null | undefined): MacroSeries {
  return live ? toMacroSeries(withLivePoint(series.history, live)) : series;
}
