// 비트코인 트랜잭션 크기·수수료 개념 계산.
// ⚠️ wallet-keys와 달리 여기 값은 실제 산술이다(가짜 값 아님).
// 입력/출력 vByte는 타입별 표준 대표값(근사) — 서명 길이에 따라 ±1~2 vB 변동하지만
// 수수료 = vByte × sat/vB 계산식 자체는 실제와 같다.

export type AddrType = "legacy" | "nested" | "native" | "taproot";

export const ADDR_TYPES: {
  value: AddrType;
  label: string;
  purpose: string;
  inputVb: number;
  outputVb: number;
}[] = [
  { value: "legacy", label: "Legacy (P2PKH)", purpose: "44'", inputVb: 148, outputVb: 34 },
  { value: "nested", label: "Nested SegWit (P2SH)", purpose: "49'", inputVb: 91, outputVb: 32 },
  { value: "native", label: "Native SegWit (P2WPKH)", purpose: "84'", inputVb: 68, outputVb: 31 },
  { value: "taproot", label: "Taproot (P2TR)", purpose: "86'", inputVb: 57.5, outputVb: 43 },
];

// version(4) + locktime(4) + 입력/출력 개수 varint + SegWit marker/flag 근사.
export const TX_OVERHEAD_VB = 10.5;

export function addrMeta(type: AddrType) {
  return ADDR_TYPES.find((t) => t.value === type) ?? ADDR_TYPES[0];
}

export function txVBytes(type: AddrType, numIn: number, numOut: number): number {
  const m = addrMeta(type);
  return TX_OVERHEAD_VB + numIn * m.inputVb + numOut * m.outputVb;
}

export function feeSats(vbytes: number, feeRate: number): number {
  return Math.ceil(vbytes * feeRate);
}

// 멤풀 혼잡도 프리셋 (sat/vB).
export const FEE_PRESETS = [
  { label: "여유", rate: 2 },
  { label: "보통", rate: 15 },
  { label: "혼잡", rate: 60 },
] as const;

export type Utxo = { id: number; sats: number };

// 큰 동전부터 그리디로 고른다. 입력을 추가할 때마다 수수료(고른 입력 수 + 출력 2개:
// 받는 사람·잔돈)를 다시 계산해, 송금액 + 수수료를 덮을 때까지 쌓는다.
export function selectCoins(
  utxos: Utxo[],
  targetSats: number,
  feeRate: number,
  type: AddrType,
): { selected: Utxo[]; fee: number; change: number; enough: boolean } {
  const sorted = [...utxos].sort((a, b) => b.sats - a.sats);
  const selected: Utxo[] = [];
  let sum = 0;
  for (const u of sorted) {
    selected.push(u);
    sum += u.sats;
    const fee = feeSats(txVBytes(type, selected.length, 2), feeRate);
    if (sum >= targetSats + fee) {
      return { selected, fee, change: sum - targetSats - fee, enough: true };
    }
  }
  const fee = feeSats(txVBytes(type, selected.length, 2), feeRate);
  return { selected, fee, change: 0, enough: false };
}

export function formatSats(sats: number): string {
  return `${sats.toLocaleString("en-US")} sat`;
}

export function satsToBtc(sats: number): string {
  return (sats / 1e8).toFixed(8);
}
