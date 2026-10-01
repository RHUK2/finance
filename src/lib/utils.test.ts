import { describe, expect, it } from 'vitest';

import {
  formatEok,
  formatEokFromMan,
  formatEokFromWon,
  formatKrwPrice,
  formatMan,
  formatPct,
  formatSigned,
  formatUsdPrice,
  formatWon,
} from './utils';

const MINUS = '−';

// 티켓 106: 음수 부호는 모두 U+2212, 반올림해 0이면 부호를 뗀다.
describe('표기 함수의 음수 부호', () => {
  it.each([
    [formatMan(-50), `${MINUS}50만원`],
    [formatWon(-50), `${MINUS}50원`],
    [formatEok(-1.5), `${MINUS}1.5억`],
    [formatEokFromMan(-5000), `${MINUS}0.50억`],
    [formatEokFromWon(-1.2e9), `${MINUS}12억원`],
    [formatPct(-5), `${MINUS}5.0%`],
  ])('%s', (actual, expected) => {
    expect(actual).toBe(expected);
    expect(actual).not.toContain('-');
  });

  it.each([
    [formatMan(-0.4), '0만원'],
    [formatEok(-0.04), '0.0억'],
    [formatEokFromMan(-3), '0.00억'],
    [formatEokFromWon(-4e7), '0억원'],
    [formatPct(-0.04), '0.0%'],
    [formatSigned(-0), '0'],
  ])('음의 0을 찍지 않는다: %s', (actual, expected) => {
    expect(actual).toBe(expected);
  });

  it('절댓값을 반올림하므로 음수 .5는 0에서 먼 쪽으로 간다', () => {
    expect(formatEokFromWon(-2.5e8)).toBe(`${MINUS}3억원`);
    expect(formatEokFromWon(2.5e8)).toBe('3억원');
  });

  it('plus는 양수에만 +를 붙이고 0에는 붙이지 않는다', () => {
    expect(formatPct(2.5, 1, { plus: true })).toBe('+2.5%');
    expect(formatPct(-2.5, 1, { plus: true })).toBe(`${MINUS}2.5%`);
    expect(formatPct(0.01, 1, { plus: true })).toBe('0.0%');
    expect(formatEokFromMan(5000, 2, { plus: true })).toBe('+0.50억');
  });

  it('천 단위 구분자', () => {
    expect(formatMan(1234)).toBe('1,234만원');
    expect(formatWon(1234567)).toBe('1,234,567원');
    expect(formatEok(1000, 0)).toBe('1,000억');
    expect(formatEokFromMan(52500)).toBe('5.25억');
  });
});

// 티켓 52: 시세 표기는 통화 기호를 앞에, 천 단위 구분자를 늘 넣는다.
describe('가격 표기', () => {
  it('formatUsdPrice', () => {
    expect(formatUsdPrice(3650.2)).toBe('$3,650.20');
    expect(formatUsdPrice(97000.4, 0)).toBe('$97,000');
    expect(formatUsdPrice(-1.5)).toBe(`${MINUS}$1.50`);
    expect(formatUsdPrice(2.5, 2, { plus: true })).toBe('+$2.50');
    expect(formatUsdPrice(-0.001)).toBe('$0.00');
  });

  it('formatKrwPrice', () => {
    expect(formatKrwPrice(1380.4)).toBe('₩1,380');
    expect(formatKrwPrice(2650.37, 2)).toBe('₩2,650.37');
    expect(formatKrwPrice(-1380.4)).toBe(`${MINUS}₩1,380`);
  });
});
