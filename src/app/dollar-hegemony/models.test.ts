import { expect, it } from 'vitest';
import { EXIT_COUNTRIES, KR_RATE, TIERS, exitLedger, exportLedger, krwChain } from './models';

it('기본 조건에서는 러시아만 이탈하고, 중국은 대체망 38%에서 남고 39%에서 이탈하며 분자를 묶고 분모만 줄이면 46%에서 기준선을 넘는다', () => {
  expect(EXIT_COUNTRIES.filter((c) => exitLedger(c, 0.35, 0.6).exits).map((c) => c.id)).toEqual(['russia']);
  const china = EXIT_COUNTRIES.find((c) => c.id === 'china')!;
  const baseline = exitLedger(china, 0.35, 0.6);
  expect(baseline.ratio).toBeCloseTo(0.958, 3);
  expect(exitLedger(china, 0.38, 0.6).exits).toBe(false);
  expect(exitLedger(china, 0.39, 0.6).exits).toBe(true);
  // exit-calculus의 접힌 설명: 분자를 기본값에 묶고 분모만 줄여도 중국은 대체망 약 46%에서 기준선을 넘는다.
  expect(baseline.benefit / exitLedger(china, 0.45, 0.6).cost).toBeLessThan(1);
  expect(baseline.benefit / exitLedger(china, 0.46, 0.6).cost).toBeGreaterThan(1);
  const russia = EXIT_COUNTRIES.find((c) => c.id === 'russia')!;
  expect(exitLedger(russia, 0.35, 0).ratio).toBeLessThan(exitLedger(russia, 0.35, 0.6).ratio);
});
it('국외 배분과 발행량을 보존하며 유출이 적으면 신흥국 압력이 발행국보다 작다', () => {
  expect(TIERS.reduce((sum, t) => sum + t.share, 0)).toBeCloseTo(1);
  for (const outflow of [0, 0.1, 0.35, 0.6, 1]) {
    const r = exportLedger(4, outflow);
    expect(r.home + r.rows.reduce((sum, row) => sum + row.inflow, 0)).toBeCloseTo(4);
    expect(r.exported + r.homePressure).toBeCloseTo(r.closedPressure);
    if (outflow === 0) expect(r.rows.every((row) => row.pressure === 0)).toBe(true);
  }
  const low = exportLedger(4, 0.1);
  expect(low.rows.find((r) => r.tier.id === 'emerging')!.pressure).toBeLessThan(low.homePressure);
});
it('감내 폭 1.5%p까지 금리를 지키고 초과분만 따라 올린다', () => {
  expect(krwChain(4, 2.5)).toMatchObject({
    holds: true,
    forcedRate: 2.5,
    loanRate: 2.5 + KR_RATE.spread.value,
  });
  expect(krwChain(4.01, 2.5).holds).toBe(false);
  expect(krwChain(5, 2.5).forcedRate).toBeCloseTo(3.3);
  expect(krwChain(1, 2.5).depreciation).toBe(0);
});
