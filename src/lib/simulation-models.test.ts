import { describe, expect, it } from 'vitest';

import { advanceRound, LOG_TICKS, logTickToValue, logValueToTick, trajectoryFrame } from './simulation-models';

describe('궤적 재생 계산', () => {
  it('시작부터 마지막 라운드까지 진행하고 즉시 종료한다', () => {
    expect(advanceRound(0, 2)).toEqual({ round: 1, hasNext: true });
    expect(advanceRound(1, 2)).toEqual({ round: 2, hasNext: false });
    expect(advanceRound(2, 2)).toEqual({ round: 2, hasNext: false });
  });

  it('단일 프레임과 궤적 축소 뒤에는 진행하지 않는다', () => {
    expect(advanceRound(0, 0)).toEqual({ round: 0, hasNext: false });
    expect(advanceRound(5, 2)).toEqual({ round: 5, hasNext: false });
  });

  it('현재 프레임을 읽고 범위를 넘으면 마지막 프레임을 읽는다', () => {
    const frames = ['시작', '중간', '끝'];
    expect(trajectoryFrame(frames, 0)).toBe('시작');
    expect(trajectoryFrame(frames, 1)).toBe('중간');
    expect(trajectoryFrame(frames, 2)).toBe('끝');
    expect(trajectoryFrame(frames, 5)).toBe('끝');
    expect(trajectoryFrame(['시작'], 0)).toBe('시작');
  });
});

describe('로그 눈금 변환', () => {
  it('양 끝과 기하평균을 각각 처음·중앙·마지막 눈금에 놓는다', () => {
    expect(logValueToTick(1, 1, 10_000)).toBe(0);
    expect(logValueToTick(100, 1, 10_000)).toBe(LOG_TICKS / 2);
    expect(logValueToTick(10_000, 1, 10_000)).toBe(LOG_TICKS);
    expect(logTickToValue(0, 1, 10_000)).toBe(1);
    expect(logTickToValue(LOG_TICKS / 2, 1, 10_000)).toBeCloseTo(100);
    expect(logTickToValue(LOG_TICKS, 1, 10_000)).toBeCloseTo(10_000);
  });

  it.each([
    [0.01, 100],
    [1e6, 1e12],
  ])('범위 %s~%s에서 모든 눈금이 왕복하고 값은 증가한다', (min, max) => {
    let previous = 0;
    for (let tick = 0; tick <= LOG_TICKS; tick++) {
      const value = logTickToValue(tick, min, max);
      expect(logValueToTick(value, min, max)).toBe(tick);
      expect(value).toBeGreaterThan(previous);
      previous = value;
    }
  });
});
