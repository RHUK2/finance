// 스크립트 실행·서명 개념 시연용 순수 계산 함수.
// ⚠️ bip-concept.ts와 같은 방식: 서명·해시·공개키는 실제 암호 연산이 아니라
// 그럴듯하게 보이는 결정적 값(illustrative)이며, 실제 지갑/자금에 쓰면 안 된다.

import { addressType } from './address-types';
import { illustrativeHex } from './bip-concept';

// 이 페이지가 다루는 주소 타입. Nested SegWit(P2SH-P2WPKH)은 뺐다. 검증 로직이
// Native SegWit과 같고 P2SH 래퍼 한 겹이 더해질 뿐이라, 스택 실행을 처음 배우는
// 자리에 넣으면 단계만 늘고 배우는 게 없다. 화면에서도 그 이유를 밝힌다.
export type ScriptAddrType = 'legacy' | 'native' | 'taproot';

// 정체(라벨)는 address-types.ts가 정한다. 여기서는 서명·검증 정보만 덧붙인다.
const SIG_META: Record<
  ScriptAddrType,
  { sigAlgo: 'ECDSA' | 'Schnorr'; unlockField: 'scriptSig' | 'witness'; sigBytes: number }
> = {
  // sigBytes는 대표 근사값 (sighash flag 포함)
  legacy: { sigAlgo: 'ECDSA', unlockField: 'scriptSig', sigBytes: 72 },
  native: { sigAlgo: 'ECDSA', unlockField: 'witness', sigBytes: 72 },
  taproot: { sigAlgo: 'Schnorr', unlockField: 'witness', sigBytes: 64 },
};

export const SCRIPT_ADDR_TYPES = (['legacy', 'native', 'taproot'] as const).map((v) => ({
  ...addressType(v),
  ...SIG_META[v],
  value: v, // addressType이 돌려주는 넓은 union 대신 이 세 값으로 좁힌다
}));

// tx-concept의 addrMeta와 이름이 겹치지 않게 한다. 한 파일에서 둘 다 쓰는 일이 생긴다.
export function scriptAddrMeta(type: ScriptAddrType) {
  return { ...addressType(type), ...SIG_META[type] };
}

// 32바이트 개인키.
export function illustrativePrivKey(seed: string): string {
  return illustrativeHex('privkey:' + seed, 64);
}

// 압축 공개키 33바이트 (02/03 + x좌표 32바이트).
export function illustrativePubKey(seed: string): string {
  return '02' + illustrativeHex('pubkey:' + seed, 64);
}

// Taproot x-only 공개키 32바이트 (부호 바이트 없이 x좌표만).
export function illustrativeXOnlyPubKey(seed: string): string {
  return illustrativeHex('xonly:' + seed, 64);
}

// 트랜잭션을 두 번 해시(SHA-256d)해서 얻는 서명 대상 다이제스트 32바이트.
export function illustrativeSighash(message: string): string {
  return illustrativeHex('sighash:' + message, 64);
}

export type EcdsaSig = { r: string; s: string; sighashFlag: string };

// ECDSA 서명 (r, s 각 32바이트) + 1바이트 sighash flag(0x01 = SIGHASH_ALL).
export function illustrativeEcdsaSig(priv: string, digest: string): EcdsaSig {
  return {
    r: illustrativeHex('r:' + priv + digest, 64),
    s: illustrativeHex('s:' + priv + digest, 64),
    sighashFlag: '01',
  };
}

// Schnorr 서명, R‖s 64바이트 통짜 (기본 SIGHASH_DEFAULT라 flag 바이트 생략).
export function illustrativeSchnorrSig(priv: string, digest: string): string {
  return illustrativeHex('schnorr:' + priv + digest, 128);
}

// HASH160 = RIPEMD160(SHA256(x)), 20바이트.
export function illustrativeHash160(pubKeyHex: string): string {
  return illustrativeHex('hash160:' + pubKeyHex, 40);
}
