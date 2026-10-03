import { describe, expect, it } from 'vitest';

import { toMacroSeries, withLive, withLivePoint } from './series';

const history = [
  { time: '2026-10-01', value: 100 },
  { time: '2026-10-02', value: 110 },
];

describe('withLivePoint', () => {
  it('같은 날의 시세는 마지막 봉을 바꾼다', () => {
    expect(withLivePoint(history, { time: '2026-10-02', value: 121 })).toEqual([
      { time: '2026-10-01', value: 100 },
      { time: '2026-10-02', value: 121 },
    ]);
  });

  it('다음 날의 시세는 새 봉으로 붙는다', () => {
    expect(withLivePoint(history, { time: '2026-10-03', value: 99 })).toHaveLength(3);
  });

  // 장이 닫힌 뒤 히스토리가 먼저 갱신되면 시세가 히스토리보다 이를 수 있다. 차트의 update도 이를 거부한다.
  it('히스토리보다 이른 시세는 버린다', () => {
    expect(withLivePoint(history, { time: '2026-10-01', value: 1 })).toBe(history);
  });

  it('시세가 없으면 히스토리 그대로다', () => {
    expect(withLivePoint(history, undefined)).toBe(history);
  });

  it('빈 히스토리에는 시세 한 점이 된다', () => {
    expect(withLivePoint([], { time: '2026-10-03', value: 5 })).toEqual([{ time: '2026-10-03', value: 5 }]);
  });
});

describe('withLive', () => {
  it('얹은 점으로 현재값과 전일 대비를 다시 계산한다', () => {
    const s = withLive(toMacroSeries(history), { time: '2026-10-02', value: 121 });
    expect(s.current).toBe(121);
    expect(s.changePercent).toBeCloseTo(21);
  });
});
