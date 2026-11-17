import { expect, it } from 'vitest';
import { buildSteps, metricsAt, sheetsAt } from './steps';

it('모든 단계에서 주체별 장부가 균형을 이루고 정부예금은 M2에서 제외된다', () => {
  for (const reserve of [0.01, 0.1, 0.3, 1]) {
    const steps = buildSteps(reserve);
    for (let i = 0; i < steps.length; i++) {
      for (const sheet of Object.values(sheetsAt(steps, i))) {
        expect(sheet.asset.reduce((s, l) => s + l.amount, 0)).toBe(sheet.liability.reduce((s, l) => s + l.amount, 0));
      }
    }
    expect(metricsAt(steps, 0)).toEqual({ m0: 0, m2: 0, multiplier: 0 });
    expect(metricsAt(steps, 1).m2).toBe(0);
    expect(metricsAt(steps, 2)).toEqual({ m0: 100, m2: 0, multiplier: 0 });
    expect(metricsAt(steps, 3)).toEqual({ m0: 100, m2: 100, multiplier: 1 });
    expect(metricsAt(steps, 4).m2).toBe(100 + Math.round(100 * (1 - reserve)));
    expect(metricsAt(steps, 5)).toEqual({
      m0: 100,
      m2: Math.round(100 / reserve),
      multiplier: Math.round(100 / reserve) / 100,
    });
  }
});

it('1~50% 지급준비율에서 해설의 통화승수가 최종 장부의 카드 값과 같다', () => {
  for (let pct = 1; pct <= 50; pct++) {
    const steps = buildSteps(pct / 100);
    const multiplier = metricsAt(steps, steps.length - 1).multiplier.toFixed(1);
    expect(steps[steps.length - 1].narration).toContain(`${multiplier}배`);
  }
});
