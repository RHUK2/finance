import { afterEach, describe, expect, it, vi } from 'vitest';

import { formatRelativeTime } from './use-relative-time';

afterEach(() => vi.restoreAllMocks());

describe('formatRelativeTime', () => {
  it.each([NaN, Infinity, -Infinity, new Date('invalid').getTime()])('유효하지 않은 시각 %s는 비워 둔다', (time) => {
    expect(formatRelativeTime(time)).toBe('');
  });

  it.each([
    [-60_000, '방금 전'],
    [0, '방금 전'],
    [59_999, '방금 전'],
    [60_000, '1분 전'],
    [59 * 60_000, '59분 전'],
    [60 * 60_000, '1시간 전'],
    [23 * 3_600_000, '23시간 전'],
    [24 * 3_600_000 - 1, '23시간 전'],
    [24 * 3_600_000, '1일 전'],
    [48 * 3_600_000, '2일 전'],
  ])('경과 %sms의 표시', (elapsed, expected) => {
    const now = Date.UTC(2026, 10, 17);
    vi.spyOn(Date, 'now').mockReturnValue(now);
    expect(formatRelativeTime(now - elapsed)).toBe(expected);
  });
});
