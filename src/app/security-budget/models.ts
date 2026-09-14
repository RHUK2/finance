// 보안 예산 페이지 전용 모델. 외부 API 없이 순수 계산이고, 프로토콜이 정해 둔
// 발행 스케줄만 진짜 값이다. 가격·수수료·공격 규모는 전부 슬라이더로 만지는 예시다.
//
// 여기 있는 모델이 `bitcoin-models.ts`로 가지 않은 이유는 이 페이지 하나만 쓰기
// 때문이다(CLAUDE.md "설명 페이지의 모델 배치"). 반감기 날짜와 일일 발행량이 필요한
// 차트 쪽 계산은 그쪽에 이미 있고, 여기서는 높이(블록 번호) 기준으로 본다.

import { BLOCKS_PER_HALVING } from '@/lib/bitcoin-models';

/** 제네시스 블록의 보조금 (BTC) */
export const INITIAL_SUBSIDY = 50;

/** 하루 144블록 × 365일. 난이도 조정이 10분을 유지한다는 전제다. */
export const BLOCKS_PER_YEAR = 144 * 365;

/** 반감기 한 번의 길이. 210,000블록 ÷ 52,560블록/년 ≈ 3.995년이라 4년으로 읽는다. */
export const HALVING_YEARS = BLOCKS_PER_HALVING / BLOCKS_PER_YEAR;

/**
 * 보조금이 0이 되는 시대 번호. 비트코인은 사토시(1e-8 BTC) 단위 정수로 계산하므로
 * 50 BTC = 5e9 사토시를 33번 반으로 자르면 정수 나눗셈에서 0이 된다. 그래서
 * 마지막으로 보조금이 나오는 시대는 32번이고, 그 끝이 2140년 언저리다.
 */
export const LAST_SUBSIDY_ERA = 32;

const SATOSHI = 1e-8;

/** 시대(반감기 횟수) 기준 블록 보조금 (BTC). 사토시 단위로 내림한다. */
export function subsidyAt(era: number): number {
  if (era < 0) return INITIAL_SUBSIDY;
  const sats = Math.floor(INITIAL_SUBSIDY / SATOSHI / 2 ** era);
  return sats * SATOSHI;
}

/**
 * 그 시대가 시작하는 해 (근사).
 *
 * 지난 반감기는 실제로 일어난 해를 그대로 쓴다. 블록이 평균 10분보다 조금 빨리
 * 나와 온 탓에 반감기가 계산보다 이르게 왔고, 제네시스에 4년씩 더하면 2024년
 * 반감기가 2025년으로 밀려 지금 시대를 틀리게 가리킨다. 아직 오지 않은 시대만
 * 마지막 실측 지점에서 210,000블록 ÷ 10분 간격으로 늘린다. 그래서 보조금이
 * 사라지는 시점이 흔히 말하는 2140년 언저리로 떨어진다.
 */
const OBSERVED_START_YEARS = [2009, 2012, 2016, 2020, 2024];

export function eraStartYear(era: number): number {
  if (era < OBSERVED_START_YEARS.length) return OBSERVED_START_YEARS[Math.max(0, era)];
  const last = OBSERVED_START_YEARS.length - 1;
  return Math.round(OBSERVED_START_YEARS[last] + (era - last) * HALVING_YEARS);
}

/**
 * 그 시대가 시작하는 시점까지 발행된 누적 공급량 (BTC). 진행 중인 시대는 세지 않는다.
 * 화면이 그 시대의 시작 연도와 함께 이 값을 보이므로 둘의 기준 시점이 같아야 한다.
 */
export function cumulativeSupply(era: number): number {
  let total = 0;
  for (let i = 0; i < era; i++) total += subsidyAt(i) * BLOCKS_PER_HALVING;
  return total;
}

// ── 블록 보상의 구성 ──────────────────────────────────────────────────────
// 채굴자가 한 블록에서 받는 돈은 보조금 + 수수료다. 보조금은 프로토콜이 정하고
// 수수료는 블록 공간 경매가 정한다. 보안 예산이란 이 둘의 합에 블록 수를 곱한 것,
// 곧 네트워크가 스스로를 지키는 데 해마다 쓰는 돈이다.

export type RevenueInput = {
  era: number;
  btcPrice: number;
  /** 블록당 수수료 합계 (BTC) */
  feePerBlock: number;
};

export function blockRevenue({ era, btcPrice, feePerBlock }: RevenueInput) {
  const subsidy = subsidyAt(era);
  const totalBtc = subsidy + feePerBlock;
  const perBlockUsd = totalBtc * btcPrice;
  const annualUsd = perBlockUsd * BLOCKS_PER_YEAR;
  const feeShare = totalBtc > 0 ? feePerBlock / totalBtc : 1;
  return { subsidy, totalBtc, perBlockUsd, annualUsd, feeShare };
}

/**
 * 지금과 같은 보안 예산을 유지하려면 블록당 수수료가 얼마여야 하는가 (BTC).
 * 보조금이 줄어든 만큼을 수수료가 메워야 한다는 뜻이고, 가격이 오르면 그만큼 덜 든다.
 */
export function requiredFee(targetAnnualUsd: number, era: number, btcPrice: number): number {
  const needPerBlockBtc = targetAnnualUsd / BLOCKS_PER_YEAR / btcPrice;
  return Math.max(0, needPerBlockBtc - subsidyAt(era));
}

// ── 예산과 공격 비용 ──────────────────────────────────────────────────────
// 채굴은 경쟁 산업이라 장기적으로 수익이 비용에 수렴한다. 그래서 연간 보안 예산은
// 곧 네트워크 전체가 해시레이트에 쓰는 돈이고, 과반을 잠시 쥐려는 공격자는 같은
// 시간 동안 그만한 돈을 태워야 한다.
//
// 여기서 세는 것은 그 운영비뿐이고 장비값은 빼 두었다. 장비를 사서 정직하게 채굴할
// 때와 견주는 계산은 /bitcoin-game-theory의 51% 공격 탭이 이미 하고 있으므로,
// 이 페이지는 '예산이 줄면 그 비용도 같이 준다'는 사슬만 본다.

/** 과반 해시레이트를 지정 시간만큼 유지하는 데 드는 운영비 (USD) */
export function attackCost(annualSecurityUsd: number, hours: number): number {
  return (annualSecurityUsd / (365 * 24)) * hours;
}
