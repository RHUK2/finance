// 비트코인 변동성 = 체제 전환 확률 페이지의 순수 계산 모델.
// 외부 API 없이 클라이언트에서 계산하며, 모든 수치는 개념 설명용 예시다.

import { clamp } from '@/lib/utils';

// 최대 발행량(2,100만 개). 성공 시(터미널) 가격 환산 분모.
export const SUPPLY = 21_000_000;
// 참조: 금 시가총액 ≈ $31.6조 (2026년 8월, 지상 금 약 216,000톤 × 온스당 $4,549 기준).
// 금값에 따라 크게 움직이는 값이라 시세가 달라지면 함께 갱신할 것.
export const GOLD_CAP = 31.6e12;

// ── 두 체제 모델 ───────────────────────────────────────────────
// 비트코인의 터미널 밸류는 두 갈래로 갈린다: 통화화 성공(winCap 포착) 또는 실패(≈0).
// 현재 함의 가격 = 성공 확률 p로 가중한 기댓값.
export function regimeImpliedPrice(p: number, winCapUsd: number) {
  const winPrice = winCapUsd / SUPPLY;
  return { winPrice, implied: p * winPrice };
}

// 위 식을 거꾸로 푼 것. 실제 시세를 넣으면 시장이 지금 매기고 있는 성공 확률이 나온다.
// 이 페이지의 논지("가격은 곧 확률이다")를 실제 숫자로 확인하는 데 쓴다.
export function impliedProbability(price: number, winCapUsd: number) {
  return price / (winCapUsd / SUPPLY);
}

// 성공 확률이 1%포인트 오를 때 가격이 몇 % 오르는가. 가격 = p × 성공가이므로
// 상대 변화율은 (0.01/p)로 성공가와 무관하고, p가 작을수록 폭발적으로 커진다.
// "작은 확률 변화에 가격이 크게 뛴다"는 이 페이지의 핵심 주장이 이 식이다.
export function pricePerPointOfP(p: number) {
  return 0.01 / p;
}

// ── 변동성 시뮬레이션 ─────────────────────────────────────────
// 시장은 매 스텝 성공 확률 p를 뉴스에 따라 수정한다(추세항 drift + 노이즈).
// drift는 확률이 평균적으로 어느 쪽으로 표류하는지를 뜻하며, 용어집의 채택률과는 다른 값이다.
// 가격 = p × winPrice 이므로 로그수익률 = log(pₜ/pₜ₋₁). p가 작을수록 같은 Δp가 더 큰 %를 만든다.
// → p가 1(확신)에 수렴할수록 %변동성이 구조적으로 감소.

// 평균 0의 삼각분포 노이즈(-1~1, 종 모양 근사).
function noise(rng: () => number) {
  return rng() + rng() - 1;
}

export function stepP(p: number, sigma: number, drift: number, rng: () => number): number {
  return clamp(p + drift + sigma * noise(rng), 0.002, 1);
}

// 최근 window 스텝 수익률의 표준편차(스텝당, 0~1 비율).
export function realizedVol(returns: number[], window: number): number {
  const slice = returns.slice(-window);
  if (slice.length < 2) return 0;
  const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
  const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / slice.length;
  return Math.sqrt(variance);
}
