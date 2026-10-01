import { describe, expect, it } from 'vitest';

import { ADDR_TYPES, addrMeta, feeSats, TX_OVERHEAD_VB, txVBytes } from './tx-concept';

// 기대값은 docs/fact-check-log.md 「트랜잭션·수수료」다.
describe('vByte 대표값', () => {
  it('입력·출력 vByte와 오버헤드', () => {
    expect(ADDR_TYPES.map((t) => [t.value, t.inputVb, t.outputVb])).toEqual([
      ['legacy', 148, 34],
      ['nested', 91, 32],
      ['native', 68, 31],
      ['taproot', 57.5, 43],
    ]);
    expect(TX_OVERHEAD_VB).toBe(10.5);
    expect(addrMeta('taproot').inputVb).toBe(57.5);
  });

  it('크기 = 오버헤드 + 입력 × 입력 vB + 출력 × 출력 vB', () => {
    expect(txVBytes('native', 1, 2)).toBe(10.5 + 68 + 62);
    expect(txVBytes('legacy', 2, 2)).toBe(10.5 + 296 + 68);
  });

  it('수수료는 사토시 정수로 올림한다', () => {
    expect(feeSats(140.5, 1)).toBe(141);
    expect(feeSats(140.5, 2)).toBe(281);
  });
});

// 티켓 23: 출력이 많으면 Taproot가 Legacy보다 커진다. 막대 폭의 분모를 Legacy로 두면 100%를 넘는다.
describe('주소 타입 비교의 최댓값', () => {
  const sizes = (numIn: number, numOut: number) =>
    Object.fromEntries(ADDR_TYPES.map((t) => [t.value, txVBytes(t.value, numIn, numOut)]));

  it('입력 2·출력 2에서는 Legacy가 가장 크다', () => {
    const s = sizes(2, 2);
    expect(Math.max(...Object.values(s))).toBe(s.legacy);
  });

  it('입력 1·출력 10에서는 Taproot 절감이 0%로 반올림된다', () => {
    const s = sizes(1, 10);
    expect(Math.round((1 - s.taproot / s.legacy) * 100)).toBe(0);
  });

  it('입력 1·출력 11부터 Taproot가 가장 크다 (Legacy보다 2% 큼)', () => {
    const s = sizes(1, 11);
    expect(Math.max(...Object.values(s))).toBe(s.taproot);
    expect(Math.round((s.taproot / s.legacy - 1) * 100)).toBe(2);
  });

  it('입력 1·출력 20: Taproot가 Legacy보다 11% 크고 Legacy 폭은 90.4%다', () => {
    const s = sizes(1, 20);
    expect(Math.round((s.taproot / s.legacy - 1) * 100)).toBe(11);
    expect((s.legacy / Math.max(...Object.values(s))) * 100).toBeCloseTo(90.4, 1);
  });
});
