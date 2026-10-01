import { describe, expect, it } from 'vitest';

import { acquisitionTaxRate, levelPayment, maxLoanByDsr, REPAY_METHODS, schedule } from './mortgage-models';

// 금액 단위는 만원. 6억 = 60,000만원.
const EOK = 10_000;

describe('acquisitionTaxRate', () => {
  // docs/fact-check-log.md 「주택담보대출」의 표(지방교육세 포함, %).
  it.each([
    [6, 1.1],
    [6.5, 1.47],
    [7, 1.83],
    [8, 2.57],
    [9, 3.3],
    [12, 3.3],
  ])('%d억 → %d%%', (eok, expected) => {
    expect(acquisitionTaxRate(eok * EOK)).toBeCloseTo(expected, 2);
  });

  it('6억·9억 두 경계가 연속이다', () => {
    const eps = 1e-6;
    expect(acquisitionTaxRate(6 * EOK + eps)).toBeCloseTo(acquisitionTaxRate(6 * EOK), 6);
    expect(acquisitionTaxRate(9 * EOK + eps)).toBeCloseTo(acquisitionTaxRate(9 * EOK), 6);
  });

  it('가격이 오르면 세율이 내려가지 않는다', () => {
    for (let man = 1_000; man < 15 * EOK; man += 500) {
      expect(acquisitionTaxRate(man + 500)).toBeGreaterThanOrEqual(acquisitionTaxRate(man));
    }
  });
});

describe('levelPayment', () => {
  it('금리가 0이면 원금을 회차로 나눈다', () => {
    expect(levelPayment(36_000, 0, 30)).toBe(100);
  });

  // fact-check-log: 금리가 그대로면 남은 잔액을 남은 기간으로 다시 나눠도 월 상환액이 같다.
  it('남은 잔액·남은 기간으로 다시 계산해도 같다', () => {
    const principal = 50_000;
    const rate = 4.2;
    const years = 30;
    const level = levelPayment(principal, rate, years);
    const rows = schedule(principal, rate, years, 'equal-payment');
    for (const elapsedYears of [1, 5, 10, 29]) {
      const balance = rows[elapsedYears * 12 - 1].balance;
      expect(levelPayment(balance, rate, years - elapsedYears)).toBeCloseTo(level, 6);
    }
  });
});

describe('schedule', () => {
  it.each(REPAY_METHODS)('%s: 원금 합이 대출 원금이고 마지막 잔액이 0이다', (method) => {
    for (const rate of [0, 3.5, 7]) {
      const rows = schedule(40_000, rate, 20, method);
      expect(rows).toHaveLength(240);
      expect(rows.reduce((s, r) => s + r.principal, 0)).toBeCloseTo(40_000, 6);
      expect(rows.at(-1)!.balance).toBeCloseTo(0, 6);
    }
  });

  it('원리금균등은 매달 이자 + 원금이 같다', () => {
    const level = levelPayment(40_000, 5, 20);
    for (const r of schedule(40_000, 5, 20, 'equal-payment')) expect(r.interest + r.principal).toBeCloseTo(level, 6);
  });

  it('만기일시는 마지막 달에만 원금을 갚는다', () => {
    const rows = schedule(40_000, 5, 20, 'bullet');
    expect(rows.slice(0, -1).every((r) => r.principal === 0)).toBe(true);
    expect(rows.at(-1)!.principal).toBe(40_000);
  });
});

describe('maxLoanByDsr', () => {
  it('한도 대출의 연 원리금이 소득 × DSR이다', () => {
    const loan = maxLoanByDsr(8_000, 40, 4.5, 30);
    expect(levelPayment(loan, 4.5, 30) * 12).toBeCloseTo(8_000 * 0.4, 6);
  });
});
