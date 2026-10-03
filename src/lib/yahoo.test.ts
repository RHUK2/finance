import { describe, expect, it } from 'vitest';

import { barDate, keepLastPerDate } from './yahoo';

// 2026-09-30~10-02에 야후 chart()가 실제로 준 일봉 타임스탬프.
describe('barDate', () => {
  it('서머타임 중인 런던 외환 봉은 현지 날짜로 읽는다', () => {
    expect(barDate(new Date('2026-09-29T23:00:00Z'), 'Europe/London')).toBe('2026-09-30');
  });

  it('겨울의 런던 봉은 UTC와 같다', () => {
    expect(barDate(new Date('2026-01-15T00:00:00Z'), 'Europe/London')).toBe('2026-01-15');
  });

  it('서울 봉은 현지 자정이라 UTC와 같은 날이다', () => {
    expect(barDate(new Date('2026-10-01T00:00:00Z'), 'Asia/Seoul')).toBe('2026-10-01');
  });

  it('뉴욕 정규장·선물 정규 봉은 그날이다', () => {
    expect(barDate(new Date('2026-09-30T13:30:00Z'), 'America/New_York')).toBe('2026-09-30');
    expect(barDate(new Date('2026-10-01T04:00:00Z'), 'America/New_York')).toBe('2026-10-01');
  });

  it('뉴욕 선물의 저녁 세션 봉은 앞 봉과 겹치지 않는다', () => {
    expect(barDate(new Date('2026-10-02T01:42:50Z'), 'America/New_York')).toBe('2026-10-02');
  });
});

describe('keepLastPerDate', () => {
  // 2026-10-02 USDKRW=X: 런던 자정 일봉 뒤에 장 마감 시세가 같은 현지 날짜로 한 점 더 붙었다.
  it('같은 날짜가 이어지면 뒤의 관측을 남긴다', () => {
    const rows = [
      { time: '2026-10-01', value: 1356.84 },
      { time: '2026-10-02', value: 1360.59 },
      { time: '2026-10-02', value: 1342.51 },
    ];
    expect(keepLastPerDate(rows)).toEqual([
      { time: '2026-10-01', value: 1356.84 },
      { time: '2026-10-02', value: 1342.51 },
    ]);
  });

  it('겹치는 날짜가 없으면 그대로다', () => {
    const rows = [
      { time: '2026-10-01', value: 1 },
      { time: '2026-10-02', value: 2 },
    ];
    expect(keepLastPerDate(rows)).toEqual(rows);
  });
});
