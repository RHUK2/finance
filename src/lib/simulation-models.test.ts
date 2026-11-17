import { describe, expect, it } from 'vitest';

import {
  advanceRound,
  linearSliderValue,
  LOG_TICKS,
  logTickToValue,
  logValueToTick,
  trajectoryFrame,
} from './simulation-models';

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

describe('슬라이더 값 격자', () => {
  it.each([
    [0.5, 10.5, 1, 1.5],
    [0, 1e-6, 1e-8, 3e-8],
    [5e-9, 1e-6, 1e-8, 3.5e-8],
    [-0.5, 5, 0.2, 0.1],
  ])('선형 범위 %s~%s에서 간격 %s와 min의 자릿수를 보존한다', (min, max, step, target) => {
    const drag = linearSliderValue(target, min, max, step);
    const plus = linearSliderValue(target - step + step, min, max, step);
    const minus = linearSliderValue(target + step - step, min, max, step);
    expect(drag).toBe(target);
    expect(plus).toBe(drag);
    expect(minus).toBe(drag);
    expect(linearSliderValue(target + step * 0.1, min, max, step)).toBe(target);
    expect(linearSliderValue(min - step, min, max, step)).toBe(min);
    expect(linearSliderValue(max + step, min, max, step)).toBe(max);
  });

  it.each([
    [0, 1e-6, 1e-8, [0, 1e-8, 2e-8, 3e-8]],
    [0.05, 1, 0.1, [0.05, 0.15, 0.25, 0.35]],
  ])('선형 범위 %s~%s에서 직전 값으로 간격 %s만큼 연속 이동한다', (min, max, step, values) => {
    let value = values[0];
    for (const expected of values.slice(1)) {
      value = linearSliderValue(value + step, min, max, step);
      expect(value).toBe(expected);
    }
    for (const expected of values.slice(0, -1).reverse()) {
      value = linearSliderValue(value - step, min, max, step);
      expect(value).toBe(expected);
    }
  });

  it('max가 격자 밖이면 끝값에 도달하고 min 기준 격자로 복귀한다', () => {
    let value = 0;
    for (const expected of [3, 6, 9, 10, 10]) {
      value = linearSliderValue(value + 3, 0, 10, 3);
      expect(value).toBe(expected);
    }
    for (const expected of [6, 3, 0, 0]) {
      value = linearSliderValue(value - 3, 0, 10, 3);
      expect(value).toBe(expected);
    }
  });

  it('로그 내부 값은 유효숫자 4자리이고 버튼과 끌기가 같은 값을 낸다', () => {
    const min = 0.123456;
    const max = 9876543;
    expect(logTickToValue(0, min, max)).toBe(min);
    expect(logTickToValue(LOG_TICKS, min, max)).toBe(max);
    for (let tick = 1; tick < LOG_TICKS; tick++) {
      const drag = logTickToValue(tick, min, max);
      expect(drag).toBe(Number(drag.toPrecision(4)));
      expect(logTickToValue(logValueToTick(logTickToValue(tick - 1, min, max), min, max) + 1, min, max)).toBe(drag);
      expect(logTickToValue(logValueToTick(logTickToValue(tick + 1, min, max), min, max) - 1, min, max)).toBe(drag);
    }
  });
});
