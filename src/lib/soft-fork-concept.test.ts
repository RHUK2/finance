import { describe, expect, it } from 'vitest';

import { type Bip9State, MAX_PERIODS, nextBip9State, SIGNAL_THRESHOLD } from './soft-fork-concept';

// 기대값은 docs/fact-check-log.md 「소프트포크」다: STARTED → LOCKED_IN → ACTIVE, 타임아웃 시 FAILED, 메인넷 95%.
describe('BIP9 상태 전이', () => {
  it('메인넷 임계값은 95%다', () => {
    expect(SIGNAL_THRESHOLD).toBe(0.95);
  });

  it('임계값을 넘은 기간 다음에 LOCKED_IN, 그다음 기간에 ACTIVE', () => {
    expect(nextBip9State('STARTED', 0.95, 1)).toBe('LOCKED_IN');
    expect(nextBip9State('STARTED', 0.9499, 1)).toBe('STARTED');
    expect(nextBip9State('LOCKED_IN', 0, 2)).toBe('ACTIVE');
  });

  it('LOCKED_IN은 신호율과 무관하게 ACTIVE로 간다 (타임아웃 기간 뒤에도)', () => {
    expect(nextBip9State('LOCKED_IN', 0, MAX_PERIODS + 1)).toBe('ACTIVE');
  });

  it('타임아웃 기간까지 못 넘으면 FAILED, 마지막 기간에 넘으면 LOCKED_IN', () => {
    expect(nextBip9State('STARTED', 0.5, MAX_PERIODS)).toBe('FAILED');
    expect(nextBip9State('STARTED', 0.95, MAX_PERIODS)).toBe('LOCKED_IN');
  });

  it('ACTIVE와 FAILED는 끝 상태다', () => {
    for (const s of ['ACTIVE', 'FAILED'] as Bip9State[]) {
      expect(nextBip9State(s, 1, 1)).toBe(s);
      expect(nextBip9State(s, 0, MAX_PERIODS)).toBe(s);
    }
  });

  // 티켓 19: 지지율 100%면 첫 기간에 잠기고 두 번째 기간에 활성화된다.
  it('지지율 100%의 궤적', () => {
    const states: Bip9State[] = [];
    let state: Bip9State = 'STARTED';
    for (let period = 1; state === 'STARTED' || state === 'LOCKED_IN'; period++) {
      state = nextBip9State(state, 1, period);
      states.push(state);
    }
    expect(states).toEqual(['LOCKED_IN', 'ACTIVE']);
  });
});
