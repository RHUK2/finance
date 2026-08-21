// 비트코인 트랜잭션 크기·수수료 개념 계산.
// ⚠️ wallet-keys와 달리 여기 값은 실제 산술이다(가짜 값 아님).
// 입력/출력 vByte는 타입별 표준 대표값(근사)이다. 서명 길이에 따라 ±1~2 vB 변동하지만
// 수수료 = vByte × sat/vB 계산식 자체는 실제와 같다.

import { ADDRESS_TYPES, type AddrType, addressType } from './address-types';

export type { AddrType };

// 타입별 입력·출력 vByte. 정체(라벨·purpose)는 address-types.ts가 정하고 여기서는
// 수수료 계산에 필요한 크기만 덧붙인다.
const VBYTES: Record<AddrType, { inputVb: number; outputVb: number }> = {
  legacy: { inputVb: 148, outputVb: 34 },
  nested: { inputVb: 91, outputVb: 32 },
  native: { inputVb: 68, outputVb: 31 },
  taproot: { inputVb: 57.5, outputVb: 43 },
};

export const ADDR_TYPES = ADDRESS_TYPES.map((t) => ({ ...t, ...VBYTES[t.value] }));

// version(4) + locktime(4) + 입력/출력 개수 varint + SegWit marker/flag 근사.
export const TX_OVERHEAD_VB = 10.5;

export function addrMeta(type: AddrType) {
  return { ...addressType(type), ...VBYTES[type] };
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
  { label: '여유', rate: 2 },
  { label: '보통', rate: 15 },
  { label: '혼잡', rate: 60 },
] as const;

export type Utxo = { id: number; sats: number };

export function formatSats(sats: number): string {
  return `${sats.toLocaleString('en-US')} sat`;
}

export function satsToBtc(sats: number): string {
  return (sats / 1e8).toFixed(8);
}
