// 선물·헤징 페이지의 순수 계산 모델. 외부 데이터를 쓰지 않고 전부 여기서 만든다.
// 단위는 배럴당 달러, 계약 규모는 배럴이다.

import { clamp, clamp01, mulberry32 } from '@/lib/utils';

// ---------------------------------------------------------------------------
// 헤지 장부
// ---------------------------------------------------------------------------

export const SPOT_NOW = 80; // 지금 원유 현물
export const FUTURES_PRICE = 78; // 3개월물 계약가
export const PRODUCER_BARRELS = 1_000_000; // 산유국이 3개월 뒤 팔 물량
export const REFINER_BARRELS = 600_000; // 정유사가 3개월 뒤 살 물량 (고정)

// 헤저끼리 물량이 딱 맞아떨어지는 일은 없다. 산유국이 넘기려는 물량 중 정유사가
// 받아 주고 남은 몫은 투기자가 받아야 하고, 투기자가 적으면 그 몫은 체결되지 않는다.
// 투기자가 많을수록 단조롭게 좋아지며 포화한다.
export function fillableShare(speculatorShare: number): number {
  return 1 - Math.exp(-3.2 * clamp01(speculatorShare));
}

// 투기자가 많아질수록 선물이 현물에서 벌어진다. 가격 발견을 넘어선 쏠림이라
// 헤저가 잠그는 가격 자체를 밀어 올린다. 단조 증가이며 단위는 배럴당 달러다.
export function basisDistortion(speculatorShare: number): number {
  return 6 * clamp01(speculatorShare) ** 3;
}

export type HedgeLedger = {
  effectiveFutures: number; // 쏠림이 반영된 실제 체결 선물가
  wanted: number; // 산유국이 넘기려 한 물량
  matched: number; // 정유사가 받아 준 물량
  toSpeculators: number; // 투기자가 받은 물량
  unfilled: number; // 상대를 찾지 못한 물량
  fillRate: number; // 넘기려 한 물량 중 실제로 넘어간 비율
  producerSpot: number; // 산유국 현물 수익
  producerFutures: number; // 산유국 선물 손익 (숏)
  producerEffective: number; // 산유국 실효 판매단가
  producerNaked: number; // 헤지를 전혀 안 했을 때의 판매단가
  refinerEffective: number; // 정유사 실효 매입단가
  speculatorPnl: number; // 투기자 손익 (롱)
};

// hedgeRatio: 산유국이 넘기려는 비율. settlePrice: 만기 시점 현물가.
export function hedgeLedger(hedgeRatio: number, settlePrice: number, speculatorShare: number): HedgeLedger {
  const effectiveFutures = FUTURES_PRICE + basisDistortion(speculatorShare);

  const wanted = PRODUCER_BARRELS * clamp01(hedgeRatio);
  const matched = Math.min(wanted, REFINER_BARRELS);
  const residual = Math.max(0, wanted - REFINER_BARRELS);
  const toSpeculators = residual * fillableShare(speculatorShare);
  const unfilled = residual - toSpeculators;
  const hedged = matched + toSpeculators;

  // 숏은 가격이 떨어질수록 벌고, 롱은 그 반대다. 헤저가 넘긴 위험은 사라지지 않고
  // 정유사와 투기자의 선물 손익으로 그대로 옮겨 간다.
  const producerSpot = settlePrice * PRODUCER_BARRELS;
  const producerFutures = (effectiveFutures - settlePrice) * hedged;
  const refinerFutures = (settlePrice - effectiveFutures) * matched;

  return {
    effectiveFutures,
    wanted,
    matched,
    toSpeculators,
    unfilled,
    fillRate: wanted === 0 ? 1 : hedged / wanted,
    producerSpot,
    producerFutures,
    producerEffective: (producerSpot + producerFutures) / PRODUCER_BARRELS,
    producerNaked: settlePrice,
    refinerEffective: (settlePrice * REFINER_BARRELS - refinerFutures) / REFINER_BARRELS,
    speculatorPnl: (settlePrice - effectiveFutures) * toSpeculators,
  };
}

// ---------------------------------------------------------------------------
// 크랙 스프레드
// ---------------------------------------------------------------------------

export const CRUDE_LOCK = 78; // 원유 롱으로 잠그는 가격
export const GASOLINE_LOCK = 95; // 휘발유 숏으로 잠그는 가격

export type CrackHedge = 'none' | 'crude' | 'both';

export type CrackResult = {
  crackNow: number; // 헤지가 없을 때의 배럴당 마진
  margin: number; // 고른 헤지 방식에서의 배럴당 마진
  locked: number; // 양쪽을 다 잠갔을 때의 마진
  exposedTo: 'both' | 'gasoline' | 'none';
};

// 원유 1배럴이 휘발유 1배럴이 된다고 단순화한다. 실제 정제 수율(3:2:1)을 넣으면
// 계수 계산에 시선이 쏠려 양방향 헤지라는 요점이 묻힌다.
export function crackResult(crude: number, gasoline: number, hedge: CrackHedge): CrackResult {
  const crackNow = gasoline - crude;
  const locked = GASOLINE_LOCK - CRUDE_LOCK;

  // 원유만 잠그면 매입가는 고정되지만 파는 쪽 가격은 그대로 노출된다.
  const margin = hedge === 'none' ? crackNow : hedge === 'crude' ? gasoline - CRUDE_LOCK : locked;

  return {
    crackNow,
    margin,
    locked,
    exposedTo: hedge === 'none' ? 'both' : hedge === 'crude' ? 'gasoline' : 'none',
  };
}

// ---------------------------------------------------------------------------
// 강제청산 연쇄
// ---------------------------------------------------------------------------

export const ENTRY_PRICE = 100; // 지수화한 진입가
export const OPENING_SHOCK = 0.14; // 첫 박자에 들어오는 외생 충격
export const CASCADE_IMPACT = 0.1; // 쏟아진 명목가가 가격을 끌어내리는 세기

const SIGMA = 0.5; // 배수 분포의 흩어짐

export type Position = {
  multiple: number; // 증거금 배수
  drawdown: number; // 청산 낙폭. 이 비율만큼 떨어지면 강제청산된다
  notional: number; // 명목가. 배수가 클수록 털릴 때 쏟아지는 매도 물량이 크다
};

export type CascadeFrame = {
  price: number;
  drawdown: number;
  liquidated: boolean[];
  justChanged: boolean[];
};

// 증거금 배수는 로그 정규로 흩어 놓는다. 정렬 축은 청산 낙폭 오름차순이므로
// 배수가 큰(=조금만 떨어져도 털리는) 포지션이 격자 앞쪽에 선다.
//
// 흩어짐(SIGMA)과 첫 충격의 크기가 이 시뮬레이션의 성격을 정한다. 흩어짐이 좁으면
// 포지션이 한 낙폭에 몰려 있어 연쇄가 전부 아니면 전무로 갈리고, 슬라이더를 움직여도
// 절벽 하나만 보인다. 지금 값은 평균 배수 2~20 구간 전체에서 살아남는 수가 매끄럽게
// 변하도록 고른 것이다.
export function buildPositions(n: number, meanMultiple: number, seed: number): Position[] {
  const rand = mulberry32(seed);
  const out: Position[] = [];

  for (let i = 0; i < n; i++) {
    // Box-Muller로 정규 난수 하나
    const u = Math.max(1e-9, rand());
    const v = rand();
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    const multiple = clamp(meanMultiple * Math.exp(SIGMA * z - SIGMA ** 2 / 2), 1.5, 60);
    const drawdown = 1 / multiple;
    out.push({ multiple, drawdown, notional: multiple });
  }

  return out.sort((a, b) => a.drawdown - b.drawdown);
}

// 라운드 수 안전장치. 연쇄는 유한 라운드에 수렴하지만, 파라미터를 잘못 넣어
// 수렴하지 않을 때 무한 루프 대신 잘린 궤적을 돌려준다. 채택 캐스케이드와 같은 값.
const MAX_ROUNDS = 200;

// 결정론적 궤적을 미리 전부 계산한다. 라운드마다 지금 낙폭이 청산 낙폭을 넘긴
// 포지션이 강제청산되고, 쏟아진 명목가가 가격을 더 끌어내려 다음 층을 넘긴다.
export function cascadeTrajectory(positions: Position[], impact: number): CascadeFrame[] {
  const n = positions.length;
  const totalNotional = positions.reduce((s, p) => s + p.notional, 0);

  let price = ENTRY_PRICE * (1 - OPENING_SHOCK);
  const liquidated = new Array<boolean>(n).fill(false);
  const frames: CascadeFrame[] = [];

  // 첫 프레임: 충격만 들어온 상태
  frames.push({ price, drawdown: OPENING_SHOCK, liquidated: [...liquidated], justChanged: new Array(n).fill(false) });

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const drawdown = 1 - price / ENTRY_PRICE;
    const justChanged = new Array<boolean>(n).fill(false);
    let dumped = 0;

    for (let i = 0; i < n; i++) {
      if (liquidated[i] || positions[i].drawdown > drawdown) continue;
      liquidated[i] = true;
      justChanged[i] = true;
      dumped += positions[i].notional;
    }

    if (dumped === 0) break;

    price = Math.max(ENTRY_PRICE * 0.05, price * (1 - impact * (dumped / totalNotional)));
    frames.push({ price, drawdown: 1 - price / ENTRY_PRICE, liquidated: [...liquidated], justChanged });
  }

  return frames;
}

// ---------------------------------------------------------------------------
// 무기한선물·펀딩비
// ---------------------------------------------------------------------------

export const FUNDING_PER_DAY = 3; // 8시간마다 한 번
export const FUNDING_CAP = 0.0075; // 회당 상한

// 롱이 쏠릴수록 롱이 숏에게 내는 돈이 커진다. 0.5는 양쪽이 균형인 지점이고,
// 그때도 완전히 0이 아닌 것은 무기한선물이 대체로 현물 위에서 거래되기 때문이다.
export function fundingRate(longShare: number): number {
  const skew = clamp01(longShare) - 0.5;
  const magnitude = 0.0001 + 0.0025 * (Math.abs(skew) / 0.4) ** 2;
  // 균형점(skew 0)에서도 부호는 롱 쪽이다. 무기한선물은 대체로 현물 위에서 거래된다.
  const direction = skew < 0 ? -1 : 1;
  return clamp(direction * magnitude, -FUNDING_CAP, FUNDING_CAP);
}

export type FundingResult = {
  perCharge: number; // 회당 요율
  annualized: number; // 연환산
  charges: number; // 보유 기간 동안의 과금 횟수
  cumulative: number; // 누적 잠식률 (복리)
};

export function fundingCost(longShare: number, days: number): FundingResult {
  const perCharge = fundingRate(longShare);
  const charges = Math.round(days * FUNDING_PER_DAY);
  return {
    perCharge,
    annualized: perCharge * FUNDING_PER_DAY * 365,
    charges,
    cumulative: (1 + perCharge) ** charges - 1,
  };
}

// 만기물의 베이시스는 만기가 0으로 끌고 간다. 무기한물은 만기가 없어 0으로 수렴하지
// 않고, 과금이 깎아 내면 쏠림이 다시 밀어 올리는 톱니를 그리며 일정 높이에 머문다.
// 쏠림이 셀수록 머무는 높이와 톱니의 진폭이 함께 커진다.
export function basisCurves(longShare: number, steps = 60): { dated: number[]; perpetual: number[] } {
  const start = 2.4;
  const skew = clamp01((clamp01(longShare) - 0.5) / 0.4);
  const level = start * (0.3 + 0.6 * skew);
  const period = 6;

  const dated: number[] = [];
  const perpetual: number[] = [];

  for (let i = 0; i < steps; i++) {
    dated.push(start * (1 - i / (steps - 1)));
    // 과금 주기 안에서는 쏠림이 베이시스를 밀어 올리고, 주기가 끝나면 과금이 깎아 낸다.
    perpetual.push(level * (0.55 + 0.45 * ((i % period) / (period - 1))));
  }

  return { dated, perpetual };
}
