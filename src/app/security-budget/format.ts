export function formatBtc(n: number): string {
  if (n >= 1) return `${n.toLocaleString('ko-KR', { maximumFractionDigits: 8 })} BTC`;
  if (n >= 0.01) {
    const rounded = n.toFixed(4);
    return `${Number(rounded) >= 1 ? '1' : rounded} BTC`;
  }
  return `${Math.round(n * 1e8).toLocaleString('ko-KR')} sat`;
}
