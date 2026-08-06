import { pctChange } from './utils';

// 라우트 핸들러 응답과 클라이언트 훅이 공유하는 시계열 요약 형태.
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
