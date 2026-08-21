// BCRA (Benefit-to-Cost Ratio of Attack): 공격 이득 ÷ 공격 비용.
// 제이슨 로워리가 `Softwar`에서 쓴 용어로, 합리적 공격자는 이 값이 1을 넘을 때만
// 공격한다고 본다. 1 미만이면 공격이 비합리가 되므로 방어에 성공한 것이다.
//
// 방향을 여기 한 곳에서 고정한다. 같은 관계를 `비용 ÷ 이득`으로 뒤집어 쓰면
// "숫자가 크면 안전"과 "숫자가 크면 위험"이 페이지마다 갈려 독자가 혼란스럽다.
// 비트코인 소프트워와 비트코인 게임이론이 함께 쓴다.

export function bcra(benefit: number, cost: number): number {
  return benefit / cost;
}

// 방어 성공 여부. 이득이 비용을 넘지 못하면 공격이 비합리다.
export function deterred(ratio: number): boolean {
  return ratio < 1;
}

// 표시용 문자열. 값이 자릿수를 넘나들어 고정 소수점 하나로는 0.03이 `0.0배`가 된다.
export function bcraLabel(ratio: number): string {
  if (ratio >= 10) return `${Math.round(ratio)}배`;
  if (ratio >= 0.1) return `${ratio.toFixed(1)}배`;
  return `${ratio.toFixed(2)}배`;
}
