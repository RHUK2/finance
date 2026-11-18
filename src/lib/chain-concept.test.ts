import { describe, expect, it } from 'vitest';

import {
  REORG_MAX_ROUNDS,
  REVERSAL_RISK_THRESHOLD,
  probabilityTone,
  reorgRaceStatus,
  stepReorgRace,
  confirmationLimitProbability,
  doubleSpendProbability,
  formatProbability,
  reversalProbability,
} from './chain-concept';

// 기대값은 docs/fact-check-log.md 「블록·합의」의 백서 11장 표(q = 0.1)다.
describe('doubleSpendProbability (백서의 z)', () => {
  it.each([
    [1, 2.0459e-1],
    [2, 5.0978e-2],
    [3, 1.3172e-2],
    [6, 2.428e-4],
    [10, 1.2414e-6],
  ])('q=0.1, z=%i → %d', (z, expected) => {
    const p = doubleSpendProbability(0.1, z);
    expect(Math.abs(p - expected) / expected).toBeLessThan(5e-4);
  });

  it('과반이면 시간이 걸릴 뿐 결국 따라잡는다', () => {
    expect(doubleSpendProbability(0.5, 6)).toBe(1);
    expect(doubleSpendProbability(0.6, 100)).toBe(1);
  });

  it('z가 늘수록 줄어든다', () => {
    for (let z = 1; z < 30; z++) {
      expect(doubleSpendProbability(0.3, z + 1)).toBeLessThan(doubleSpendProbability(0.3, z));
    }
  });
});

// 티켓 12·43: 확인 수는 담긴 블록을 1확인으로 센다. z = 확인 수 − 1.
describe('reversalProbability (확인 수)', () => {
  it('확인 0개·1개는 z ≤ 0이라 1이다', () => {
    expect(reversalProbability(0.1, 0)).toBe(1);
    expect(reversalProbability(0.1, 1)).toBe(1);
  });

  it('확인 6개는 백서 z = 5의 9.137e-4다', () => {
    const p = reversalProbability(0.1, 6);
    expect(p).toBeCloseTo(9.137e-4, 6);
    expect(p).toBe(doubleSpendProbability(0.1, 5));
    expect(formatProbability(p)).toBe('약 1,094분의 1');
  });

  it('확인 2개는 백서 z = 1의 2.0459e-1이다', () => {
    expect(reversalProbability(0.1, 2)).toBeCloseTo(0.20459, 5);
    expect(formatProbability(reversalProbability(0.1, 2))).toBe('20.5%');
  });

  it('공격자가 클수록 6확인도 뒤집힌다', () => {
    expect(formatProbability(reversalProbability(0.3, 6))).toBe('17.7%');
    expect(formatProbability(reversalProbability(0.45, 6))).toBe('79.0%');
  });
});

describe('formatProbability', () => {
  it('1% 이상은 백분율, 그 아래는 N분의 1', () => {
    expect(formatProbability(0.5)).toBe('50.0%');
    expect(formatProbability(0.01)).toBe('1.0%');
    expect(formatProbability(0.001)).toBe('약 1,000분의 1');
    expect(formatProbability(0)).toBe('0%에 근접');
  });
});

describe('confirmationLimitProbability', () => {
  it.each([
    [0.49, 0],
    [0.5, 1],
    [0.51, 1],
  ])('공격자 비중 %d의 확인 수 극한은 %d다', (q, expected) => {
    expect(confirmationLimitProbability(q)).toBe(expected);
  });
});

describe('경주의 전이와 종료', () => {
  it('다음 블록 한 개만 늘리고 난수 경계는 정직한 체인으로 보낸다', () => {
    const start = { round: 0, honestBlocks: 3, attackerBlocks: 0 };
    expect(stepReorgRace(start, 0.2, 0.19)).toEqual({ round: 1, honestBlocks: 3, attackerBlocks: 1 });
    expect(stepReorgRace(start, 0.2, 0.2)).toEqual({ round: 1, honestBlocks: 4, attackerBlocks: 0 });
  });

  it('같은 길이에 도달하면 성공으로 멈춘다', () => {
    const next = stepReorgRace({ round: 2, honestBlocks: 3, attackerBlocks: 2 }, 0.2, 0);
    expect(reorgRaceStatus(next)).toEqual({ caughtUp: true, timedOut: false, finished: true });
    expect(stepReorgRace(next, 0.2, 0.9)).toBe(next);
  });

  it('마지막 라운드의 따라잡기를 시간 초과보다 먼저 판정한다', () => {
    const start = { round: REORG_MAX_ROUNDS - 1, honestBlocks: 3, attackerBlocks: 2 };
    expect(reorgRaceStatus(stepReorgRace(start, 0.5, 0)).caughtUp).toBe(true);
    const timeout = stepReorgRace(start, 0.5, 0.9);
    expect(reorgRaceStatus(timeout)).toEqual({ caughtUp: false, timedOut: true, finished: true });
    expect(stepReorgRace(timeout, 0.5, 0)).toBe(timeout);
  });

  it('상품 인도 뒤 시작하는 경주는 백서의 선행 채굴을 포함하지 않는다', () => {
    // 유한 경주의 성공 질량을 전수 합산한다. 확인 3개 격차에서 출발하므로
    // q/p의 세제곱에 접근하고, 선행 채굴을 포함한 백서의 확률보다 작다.
    const q = 0.2;
    let active = new Map([[3, 1]]);
    let success = 0;
    for (let round = 0; round < REORG_MAX_ROUNDS; round++) {
      const next = new Map<number, number>();
      for (const [gap, mass] of active) {
        const state = { round, honestBlocks: gap, attackerBlocks: 0 };
        for (const [random, weight] of [
          [0, q],
          [0.9, 1 - q],
        ]) {
          const result = stepReorgRace(state, q, random);
          if (reorgRaceStatus(result).caughtUp) success += mass * weight;
          else {
            const nextGap = result.honestBlocks - result.attackerBlocks;
            next.set(nextGap, (next.get(nextGap) ?? 0) + mass * weight);
          }
        }
      }
      active = next;
    }
    expect(success).toBeCloseTo((q / (1 - q)) ** 3, 8);
    expect(success).toBeLessThan(reversalProbability(q, 3));
  });
});

describe('확률 판정 경계', () => {
  it('1% 경계의 양쪽을 같은 기준으로 판정한다', () => {
    expect(probabilityTone(REVERSAL_RISK_THRESHOLD - 0.00001)).toBe('good');
    expect(probabilityTone(REVERSAL_RISK_THRESHOLD)).toBe('bad');
    expect(probabilityTone(0.03)).toBe('bad');
  });
});
