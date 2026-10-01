import { describe, expect, it } from 'vitest';

import { daysToRetarget, FACTS, formatDuration, LOCK_IN_PCT_LABEL, SIGNAL_PCT_LABEL } from './models';

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
