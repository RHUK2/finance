// 체인 재구성(reorg)·이중지불 확률 개념 계산.
// ⚠️ doubleSpendProbability는 비트코인 백서 11장의 공식을 그대로 구현한 실제 수식이다(근사/가짜 값 아님).
// q(공격자 해시레이트 비중)가 z블록만큼 뒤처진 상태에서 정직한 체인을 끝내 따라잡을 확률을 구한다.
// 백서의 z는 트랜잭션이 담긴 블록 뒤에 이어진 블록 수다. 화면의 확인 수는 담긴 블록을 1확인으로 세므로
// (CONTEXT.md 「확인 수」) z = 확인 수 − 1이다. 화면은 확인 수를 받는 reversalProbability를 부른다.

import { clamp01, formatPct } from './utils';

// 포아송 분포 pmf를 k=0부터 누적하며 계산해, 큰 z에서도 팩토리얼 오버플로 없이 안전하게 계산한다.
export function doubleSpendProbability(q: number, z: number): number {
  const p = 1 - q;
  if (q >= p) return 1; // 51%를 넘으면 시간이 걸릴 뿐 결국 확률 1로 수렴한다.
  if (z <= 0) return 1;

  const lambda = z * (q / p);
  let poissonTerm = Math.exp(-lambda); // k=0 항
  let cumulative = 0;
  for (let k = 0; k <= z; k++) {
    cumulative += poissonTerm * (1 - Math.pow(q / p, z - k));
    poissonTerm *= lambda / (k + 1); // k+1 항으로 갱신
  }
  return clamp01(1 - cumulative);
}

// 확인 수(담긴 블록 = 1확인)를 받아 백서의 z = 확인 수 − 1로 넘긴다. 확인 0개(미확정)와 1개는 z ≤ 0이라 1이다.
export function reversalProbability(q: number, confirmations: number): number {
  return doubleSpendProbability(q, confirmations - 1);
}

export const CONFIRMATION_PRESETS = [1, 2, 3, 6, 10, 20] as const;

// 확률을 사람이 읽기 좋은 문자열로. 1% 이상이면 %로, 그보다 작으면 "약 1,000분의 1" 식으로.
export function formatProbability(p: number): string {
  if (p >= 0.01) return formatPct(p * 100, 1);
  if (p <= 0) return '0%에 근접';
  const denominator = Math.round(1 / p);
  return `약 ${denominator.toLocaleString('ko-KR')}분의 1`;
}
