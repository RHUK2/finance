import { describe, expect, it } from 'vitest';

import {
  daysToRetarget,
  FACTS,
  formatDuration,
  LOCK_IN_PCT_LABEL,
  SIGNAL_PCT_LABEL,
  SEND_AMOUNT,
  protectionAvailable,
  replayPossible,
  replayStages,
} from './models';

// 티켓 11: 0.55 × 100의 부동소수 꼬리가 화면에 새지 않는다.
describe('BIP-110 표기', () => {
  it('임계값 55%, 신호율 51 / 2016 = 2.53%', () => {
    expect(LOCK_IN_PCT_LABEL).toBe('55%');
    expect(SIGNAL_PCT_LABEL).toBe('2.53%');
    expect(FACTS.signalingShare.value).toBe(51 / 2016);
  });
});

// 티켓 106: 구간은 반올림한 값으로 고른다.
describe('formatDuration', () => {
  it.each([
    [89.4, '89분'],
    [89.6, '1.5시간'],
    [90, '1.5시간'],
    [2877, '2.0일'],
  ])('%d분 → %s', (minutes, label) => {
    expect(formatDuration(minutes)).toBe(label);
  });
});

describe('daysToRetarget', () => {
  it('해시레이트 전부면 14일, 절반이면 28일', () => {
    expect(daysToRetarget(1)).toBeCloseTo(14, 12);
    expect(daysToRetarget(0.5)).toBeCloseTo(28, 12);
  });
});

describe('리플레이 보호와 다섯 단계 잔고', () => {
  it.each([
    { kind: 'soft' as const, protection: false, available: false, replayed: true },
    { kind: 'soft' as const, protection: true, available: false, replayed: true },
    { kind: 'hard' as const, protection: false, available: true, replayed: true },
    { kind: 'hard' as const, protection: true, available: true, replayed: false },
  ])('$kind / 보호 $protection', ({ kind, protection, available, replayed }) => {
    expect(protectionAvailable(kind)).toBe(available);
    expect(replayPossible(kind, protection)).toBe(replayed);

    const stages = replayStages(kind, protection);
    expect(stages).toHaveLength(5);
    const start = stages[0].main;
    const spent = start - SEND_AMOUNT;
    expect(stages.map(({ main, forked }) => [main, forked])).toEqual([
      [start, 0],
      [start, start],
      [spent, start],
      [spent, replayed ? spent : start],
      [spent, replayed ? spent : start],
    ]);
  });
});
