// 스크립트 실행·서명 개념 시연용 순수 계산 함수.
// ⚠️ bip-concept.ts와 같은 방식: 서명·해시·공개키는 실제 암호 연산이 아니라
// 그럴듯하게 보이는 결정적 값(illustrative)이며, 실제 지갑/자금에 쓰면 안 된다.

import { illustrativeHex } from "./bip-concept";

export type ScriptAddrType = "legacy" | "native" | "taproot";

export const SCRIPT_ADDR_TYPES: {
  value: ScriptAddrType;
  label: string;
  sigAlgo: "ECDSA" | "Schnorr";
  unlockField: "scriptSig" | "witness";
  sigBytes: number; // 대표 근사값 (sighash flag 포함)
}[] = [
  {
    value: "legacy",
    label: "Legacy (P2PKH)",
    sigAlgo: "ECDSA",
    unlockField: "scriptSig",
    sigBytes: 72,
  },
  {
    value: "native",
    label: "Native SegWit (P2WPKH)",
    sigAlgo: "ECDSA",
    unlockField: "witness",
    sigBytes: 72,
  },
  {
    value: "taproot",
    label: "Taproot (P2TR, key-path)",
    sigAlgo: "Schnorr",
    unlockField: "witness",
    sigBytes: 64,
  },
];

export function addrMeta(type: ScriptAddrType) {
  return (
    SCRIPT_ADDR_TYPES.find((t) => t.value === type) ?? SCRIPT_ADDR_TYPES[0]
  );
}

// 32바이트 개인키.
export function illustrativePrivKey(seed: string): string {
  return illustrativeHex("privkey:" + seed, 64);
}

// 압축 공개키 33바이트 (02/03 + x좌표 32바이트).
export function illustrativePubKey(seed: string): string {
  return "02" + illustrativeHex("pubkey:" + seed, 64);
}

// Taproot x-only 공개키 32바이트 (부호 바이트 없이 x좌표만).
export function illustrativeXOnlyPubKey(seed: string): string {
  return illustrativeHex("xonly:" + seed, 64);
}

// 트랜잭션을 두 번 해시(SHA-256d)해서 얻는 서명 대상 다이제스트 32바이트.
export function illustrativeSighash(message: string): string {
  return illustrativeHex("sighash:" + message, 64);
}

export type EcdsaSig = { r: string; s: string; sighashFlag: string };

// ECDSA 서명 (r, s 각 32바이트) + 1바이트 sighash flag(0x01 = SIGHASH_ALL).
export function illustrativeEcdsaSig(priv: string, digest: string): EcdsaSig {
  return {
    r: illustrativeHex("r:" + priv + digest, 64),
    s: illustrativeHex("s:" + priv + digest, 64),
    sighashFlag: "01",
  };
}

// Schnorr 서명, R‖s 64바이트 통짜 (기본 SIGHASH_DEFAULT라 flag 바이트 생략).
export function illustrativeSchnorrSig(priv: string, digest: string): string {
  return illustrativeHex("schnorr:" + priv + digest, 128);
}

// HASH160 = RIPEMD160(SHA256(x)), 20바이트.
export function illustrativeHash160(pubKeyHex: string): string {
  return illustrativeHex("hash160:" + pubKeyHex, 40);
}
