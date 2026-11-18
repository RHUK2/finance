import { formatPct } from '@/lib/utils';

// 자본구조 페이지의 공용 수치. 탭마다 따로 적으면 예시 회사의 조건이 탭 사이에서
// 어긋난다(CLAUDE.md "규제·법률·세율 수치").

/**
 * 예시 법인세율(%). 법정 세율이 아니라 구조를 보이려고 고른 단일 세율이다.
 *
 * 실제 법인세는 과세표준 구간별 누진세율이고 지방소득세가 따로 붙는다. 여기서는
 * 이익이 날 때만 하나의 세율로 매기는 것으로 단순화했으므로, 화면에 이 값을 쓰는
 * 곳은 예시라는 사실이 함께 읽히도록 둔다.
 *
 * `부채와 자본` 탭은 이 값을 고정해 쓰고, `이자의 세금 방패` 탭은 같은 값을 슬라이더
 * 기본값으로 삼아 사용자가 움직인다. 두 탭이 다른 세율에서 출발하지 않도록 여기서
 * 한 번만 정한다.
 */
export const TAX_RATE = 20;

export const TAX_RATE_NOTE = '예시 단일 세율, 법정 누진세율 아님';

// 단위는 억원. 총자산을 1,000억으로 고정하고 그 안에서 부채와 자본의 비율만 바꾼다.
export const ASSETS = 1000;
export const DEFAULT_RATE = 5;
export const DEFAULT_DEBT_RATIO = 40;

export const REGULATION = {
  priorityWageMonths: 3,
  priorityRetirementYears: 3,
  priorityNote: '근로기준법 제38조 제2항·근로자퇴직급여 보장법 제12조 제2항, 2026.11.18 확인',
} as const;

// 이익이 날 때만 법인세를 매긴다. 결손금 이월공제는 넣지 않은 단순화다.
export function netIncome(ebit: number, interest: number, taxRate = TAX_RATE) {
  const pretax = ebit - interest;
  return pretax - Math.max(0, pretax) * (taxRate / 100);
}

export function leverage(debtRatio: number, rate: number, ebit: number) {
  const debt = (ASSETS * debtRatio) / 100;
  const equity = ASSETS - debt;
  const interest = (debt * rate) / 100;

  const net = netIncome(ebit, interest);

  // ROA와 ROE를 같은 잣대로 재야 "ROE가 ROA를 넘어선다"는 문장이 화면의 숫자와 맞는다.
  // ROE는 세금을 뺀 뒤의 값이므로 ROA도 세후로 잡는다. 곧 빚이 없을 때의 순이익 ÷ 자산이고,
  // 아래 표의 '무차입' 열과 정확히 같은 정의다. 이자율도 손금 효과를 반영한 세후로 비교한다.
  const roa = (netIncome(ebit, 0) / ASSETS) * 100;
  const roe = (net / equity) * 100;
  const afterTaxRate = rate * (1 - TAX_RATE / 100);
  const coverage = interest > 0 ? ebit / interest : null;
  // 손금 효과는 깎을 이익이 있을 때만 실현된다. 영업이익이 이자보다 작으면 모자란 만큼 덜 깎인다.
  const realizedShield = netIncome(ebit, interest) - (netIncome(ebit, 0) - interest);
  const realizedRate = debt > 0 ? ((interest - realizedShield) / debt) * 100 : afterTaxRate;
  return { debt, equity, interest, net, roa, roe, afterTaxRate, coverage, realizedShield, realizedRate };
}

// 부채가 늘수록 커지는 재무곤경 기대비용. 방패는 부채에 비례해 늘기만 하므로,
// 이보다 가파른 4차식으로 두어야 내부 최적점이 생긴다.
const DISTRESS_K = 0.3;

// 화면에는 이름이 닮은 두 값이 함께 나온다. 헷갈리지 않도록 함수 이름부터 갈라 둔다.
//   annualShield: 올해 한 해 덜 낸 법인세. 이자 × 세율.
//   shieldValue:  그 절감이 매년 이어진다고 보고 현재가치로 합친 값. 이자율로 할인하면
//                 이자율이 약분돼 부채 × 세율만 남는다. 곡선이 이자율과 무관한 이유다.
export function shieldValue(debtPct: number, taxRate: number) {
  return ((ASSETS * debtPct) / 100) * (taxRate / 100);
}

export function distressCost(debtPct: number) {
  return ASSETS * DISTRESS_K * (debtPct / 100) ** 4;
}

export function firmValue(debtPct: number, taxRate: number) {
  return ASSETS + shieldValue(debtPct, taxRate) - distressCost(debtPct);
}

export function taxShield(debtRatio: number, taxRate: number, ebit: number, rate: number) {
  const debt = (ASSETS * debtRatio) / 100;
  const interest = (debt * rate) / 100;
  const tax = Math.max(0, ebit - interest) * (taxRate / 100);
  const net = ebit - interest - tax;
  const annualShield = Math.max(0, ebit) * (taxRate / 100) - tax;
  return { debt, interest, tax, net, annualShield };
}

// 위에서부터 순서대로 물을 채운다. 앞 계층이 다 차야 다음 계층에 물이 닿는다.
export function waterfall<T extends { claim: number }>(tiers: T[], proceeds: number) {
  let remaining = proceeds;
  const rows = tiers.map((t) => {
    const paid = Math.min(t.claim, remaining);
    remaining -= paid;
    return { ...t, paid, rate: (paid / t.claim) * 100 };
  });
  const fulcrum = rows.find((r) => r.paid > 0 && r.paid < r.claim) ?? rows.find((r) => r.paid === 0);
  return { rows, fulcrum };
}

// 교육용 예시 회사. 금액 단위는 억원, 주가는 원.
export const BASE_SHARES = 10_000_000;
export const CB_FACE = 100;
export const CB_COUPON = 3; // 만기까지 받는 이자 총액
export const CONV_PRICE = 20_000;
export const CB_SHARES = (CB_FACE * 1e8) / CONV_PRICE;
export const REDEEM = CB_FACE + CB_COUPON;
export const CONV_STAKE = CB_SHARES / (BASE_SHARES + CB_SHARES);
export const BREAKEVEN = REDEEM / CONV_STAKE;

export function hybrid(value: number) {
  const convValue = value * CONV_STAKE;
  const converts = convValue > REDEEM;
  const holder = converts ? convValue : REDEEM;
  const existing = value - holder;

  const priceConverted = (value * 1e8) / (BASE_SHARES + CB_SHARES);
  const priceRedeemed = ((value - REDEEM) * 1e8) / BASE_SHARES;
  const price = converts ? priceConverted : priceRedeemed;

  return { convValue, converts, holder, existing, priceConverted, priceRedeemed, price };
}

export function saleProceedsNote(proceeds: number) {
  const discount = ((ASSETS - proceeds) / ASSETS) * 100;
  return discount > 0
    ? `장부가 대비 ${formatPct(discount, 0)} 할인된 값이다`
    : discount < 0
      ? `장부가 대비 ${formatPct(-discount, 0)} 웃돈이 붙은 값이다`
      : '장부가와 같다';
}
