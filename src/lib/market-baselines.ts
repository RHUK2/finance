// 여러 설명 페이지가 "지금 시장"의 출발점으로 함께 쓰는 기준 시세. 슬라이더 기본값이나 비교의
// 원점으로만 쓰며 실측 시세가 아니다. 기준 시점이 지나면 이 한 곳만 고치고 docs/fact-check-log.md
// 「시간이 지나면 다시 봐야 하는 값」 표를 함께 맞춘다.

import type { Fact } from './fact';

/** BTC 기준 시세(USD). 51% 공격 탭의 기본값과 보안 예산 페이지의 기준점이 이 값에서 출발한다. */
export const BTC_PRICE_BASELINE = {
  value: 75_000,
  label: 'BTC 기준 시세 (USD)',
  asOf: '2026년 8월',
  source: '기준 시점 시세 언저리를 반올림한 값',
} satisfies Fact;
