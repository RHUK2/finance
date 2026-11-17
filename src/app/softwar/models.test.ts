import { describe, expect, it } from 'vitest';

import { buildOrganisms, powerCapture, predationTrajectory } from './models';

describe('개체군 투사력', () => {
  it.each([0, 0.2, 0.45, 0.5, 0.8, 1])('평균 %s를 유한 개체군에서도 보존한다', (mean) => {
    for (const n of [1, 179, 180]) {
      for (const seed of [1, 24680, 42]) {
        const organisms = buildOrganisms(n, mean, seed);
        expect(organisms).toHaveLength(n);
        expect(organisms.reduce((sum, o) => sum + o.power, 0) / n).toBeCloseTo(mean, 12);
        expect(organisms.every((o) => o.power >= 0 && o.power <= 1)).toBe(true);
        expect(organisms.map((o) => o.power)).toEqual(organisms.map((o) => o.power).sort((a, b) => a - b));
        for (const o of organisms) {
          expect(o.type).toBe(o.power < 0.33 ? '평화주의자' : o.power < 0.66 ? '약한 방어' : '강한 투사자');
        }
      }
    }
  });

  it('같은 seed는 재현되고 다른 seed는 분포를 바꾼다', () => {
    expect(buildOrganisms(180, 0.8, 24680)).toEqual(buildOrganisms(180, 0.8, 24680));
    expect(buildOrganisms(180, 0.8, 24680)).not.toEqual(buildOrganisms(180, 0.8, 42));
  });
});

describe('포식 궤적', () => {
  it.each([0, 0.01, 0.1, 0.33, 0.5, 0.9, 1])('압력 %s에서 종료하고 도태는 연속 구간이다', (pressure) => {
    const organisms = buildOrganisms(180, 0.45, 24680);
    const frames = predationTrajectory(organisms, pressure);
    expect(frames.length).toBeLessThanOrEqual(22);
    expect(frames.at(-1)!.state.threshold).toBe(pressure);
    frames.forEach(({ state, justChanged }, round) => {
      const aliveCount = state.alive.filter(Boolean).length;
      expect(state.round).toBe(round);
      expect(state.history).toHaveLength(round + 1);
      expect(state.history.at(-1)).toBe(aliveCount / organisms.length);
      expect(state.alive).toEqual(organisms.map((o) => o.power >= state.threshold));
      expect(state.alive).toEqual([...Array(180 - aliveCount).fill(false), ...Array(aliveCount).fill(true)]);
      if (round > 0) {
        const prev = frames[round - 1].state;
        expect(state.threshold).toBeGreaterThan(prev.threshold);
        expect(aliveCount).toBeLessThanOrEqual(prev.alive.filter(Boolean).length);
        expect(justChanged).toEqual(state.alive.map((alive, i) => !alive && prev.alive[i]));
      } else {
        expect(justChanged.every((changed) => !changed)).toBe(true);
      }
    });
  });

  it('낮은 압력에서는 전원 생존하고, 같은 투사력은 생존하며 그보다 약하면 도태된다', () => {
    expect(
      predationTrajectory(buildOrganisms(180, 0.8, 24680), 0.1)
        .at(-1)!
        .state.alive.every(Boolean),
    ).toBe(true);
    const organisms = buildOrganisms(3, 0.5, 24680);
    expect(predationTrajectory(organisms, 0.5).at(-1)!.state.alive).toEqual([false, true, true]);
    expect(predationTrajectory(organisms, 1).at(-1)!.state.alive).toEqual([false, false, false]);
  });
});

describe('권력 포획', () => {
  it.each([
    [99, false],
    [100, true],
    [101, true],
  ])('이득 %s와 비용 100의 BCRA 1 경계에서 captured=%s', (value, captured) => {
    const result = powerCapture({ value, abstractDefense: 100, physicalWall: 100 });
    for (const regime of [result.abstract, result.physical]) {
      expect(regime).toEqual({ cost: 100, bcra: value / 100, captured });
    }
  });

  it('추상 방어와 물리 벽의 비용을 독립적으로 적용한다', () => {
    const result = powerCapture({ value: 100, abstractDefense: 50, physicalWall: 200 });
    expect(result.abstract).toEqual({ cost: 50, bcra: 2, captured: true });
    expect(result.physical).toEqual({ cost: 200, bcra: 0.5, captured: false });
  });
});
