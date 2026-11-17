export function formatBtc(n: number): string {
  if (n >= 1) return `${n.toLocaleString('ko-KR', { maximumFractionDigits: 8 })} BTC`;
  if (n >= 0.01) return `${n.toFixed(4)} BTC`;
  return `${Math.round(n * 1e8).toLocaleString('ko-KR')} sat`;
}
