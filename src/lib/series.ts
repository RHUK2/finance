import { pctChange } from './utils';

// 라우트 핸들러 응답과 클라이언트 훅이 공유하는 시계열 요약 형태.
export type MacroSeries = {
  history: { time: string; value: number }[];
  current: number | null;
  changePercent: number | null;
};

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
