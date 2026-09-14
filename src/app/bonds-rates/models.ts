// 채권·금리 페이지 전용 모델. 외부 API 없이 순수 계산이고, 여기 있는 식은 추정이
// 아니라 정의다. 채권 가격은 미래 현금흐름을 할인한 값으로 '정해지는' 것이지
// 모델이 맞히려 드는 값이 아니다. 화면에 쓰는 액면·쿠폰·만기는 예시 숫자다.

export type Bond = {
  /** 액면가 (만기에 돌려받는 원금) */
  face: number;
  /** 표면금리. 해마다 face × couponRate를 받는다 */
  couponRate: number;
  /** 잔존 만기 (년) */
  years: number;
  /** 시장이 요구하는 수익률 (만기수익률) */
  ytm: number;
};

/**
 * 채권 가격 = 남은 이자와 원금을 시장 요구수익률로 할인한 현재가치의 합.
 * 연 1회 지급으로 단순화한다. 실제 국채는 반년마다 주지만 가격과 금리가 반대로
 * 움직인다는 이 페이지의 논지는 지급 주기에 달라지지 않는다.
 */
export function bondPrice({ face, couponRate, years, ytm }: Bond): number {
  const coupon = face * couponRate;
  let pv = 0;
  for (let t = 1; t <= years; t++) pv += coupon / (1 + ytm) ** t;
  pv += face / (1 + ytm) ** years;
  return pv;
}

/**
 * 맥컬리 듀레이션: 현금흐름을 현재가치로 가중한 평균 회수 기간 (년).
 * 만기와 다른 값인 이유는 중간에 받는 이자가 원금 회수를 앞당기기 때문이다.
 */
export function macaulayDuration(bond: Bond): number {
  const { face, couponRate, years, ytm } = bond;
  const coupon = face * couponRate;
  const price = bondPrice(bond);
  let weighted = 0;
  for (let t = 1; t <= years; t++) weighted += (t * coupon) / (1 + ytm) ** t;
  weighted += (years * face) / (1 + ytm) ** years;
  return weighted / price;
}

/** 수정 듀레이션: 금리가 1%p 오를 때 가격이 몇 % 빠지는지의 근사 기울기 */
export function modifiedDuration(bond: Bond): number {
  return macaulayDuration(bond) / (1 + bond.ytm);
}

/** 금리가 delta(%p, 0.01 = 1%p)만큼 움직였을 때의 실제 가격과 듀레이션 근사치 */
export function rateShock(bond: Bond, delta: number) {
  const before = bondPrice(bond);
  const after = bondPrice({ ...bond, ytm: Math.max(0, bond.ytm + delta) });
  const actualPct = (after / before - 1) * 100;
  // 듀레이션은 1차 근사라 금리가 크게 움직이면 실제와 벌어진다. 그 차이가 볼록성이다.
  const approxPct = -modifiedDuration(bond) * delta * 100;
  return { before, after, actualPct, approxPct, convexityGap: actualPct - approxPct };
}

// ── 수익률 곡선 ───────────────────────────────────────────────────────────

export const TENORS = [
  { label: '3M', years: 0.25 },
  { label: '2Y', years: 2 },
  { label: '5Y', years: 5 },
  { label: '10Y', years: 10 },
  { label: '30Y', years: 30 },
] as const;

export type CurveShape = 'normal' | 'flat' | 'inverted';

/**
 * 모양 하나와 단기금리 하나로 곡선을 만든다. 실제 곡선을 재현하려는 것이 아니라
 * 세 모양이 무엇을 뜻하는지 보이려는 것이라, 만기별 가산폭을 모양마다 고정해 둔다.
 * 실제 값은 경제 차트의 수익률 곡선 스프레드에서 본다.
 */
const SHAPE_SPREADS: Record<CurveShape, number[]> = {
  // 3M · 2Y · 5Y · 10Y · 30Y 순서의 단기금리 대비 가산폭 (%p)
  normal: [0, 0.4, 0.9, 1.3, 1.6],
  flat: [0, 0.1, 0.15, 0.2, 0.2],
  inverted: [0, -0.3, -0.7, -0.9, -0.8],
};

export function curveYields(shape: CurveShape, shortRate: number): number[] {
  return SHAPE_SPREADS[shape].map((s) => Math.max(0, shortRate + s));
}

/** 10년물 − 2년물. 이 값이 음수인 상태를 장단기 금리 역전이라 부른다. */
export function spread10y2y(ys: number[]): number {
  const i10 = TENORS.findIndex((t) => t.label === '10Y');
  const i2 = TENORS.findIndex((t) => t.label === '2Y');
  return ys[i10] - ys[i2];
}
