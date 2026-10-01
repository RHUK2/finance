import { describe, expect, it } from 'vitest';

import {
  illustrativeEcdsaSig,
  illustrativeHash160,
  illustrativePrivKey,
  illustrativePubKey,
  illustrativeSchnorrSig,
  illustrativeSighash,
  illustrativeXOnlyPubKey,
  SCRIPT_ADDR_TYPES,
  scriptAddrMeta,
} from './script-concept';

// 기대값은 docs/fact-check-log.md 「서명·스크립트」다. hex 두 글자가 1바이트다.
const bytes = (hex: string) => hex.length / 2;

describe('서명·키 길이', () => {
  it('ECDSA는 72B 근사(sighash flag 포함), Schnorr는 64B', () => {
    expect(SCRIPT_ADDR_TYPES.map((t) => [t.value, t.sigAlgo, t.sigBytes])).toEqual([
      ['legacy', 'ECDSA', 72],
      ['native', 'ECDSA', 72],
      ['taproot', 'Schnorr', 64],
    ]);
    expect(scriptAddrMeta('legacy').unlockField).toBe('scriptSig');
    expect(scriptAddrMeta('native').unlockField).toBe('witness');
  });

  it('개인키 32B, 압축 공개키 33B(02/03 접두), x-only 32B, sighash 32B, HASH160 20B', () => {
    expect(bytes(illustrativePrivKey('a'))).toBe(32);
    const pub = illustrativePubKey('a');
    expect(bytes(pub)).toBe(33);
    expect(pub).toMatch(/^0[23]/);
    expect(bytes(illustrativeXOnlyPubKey('a'))).toBe(32);
    expect(bytes(illustrativeSighash('a'))).toBe(32);
    expect(bytes(illustrativeHash160(pub))).toBe(20);
  });

  it('ECDSA r·s 각 32B + flag 0x01, Schnorr R‖s 64B', () => {
    const sig = illustrativeEcdsaSig('k', 'd');
    expect([bytes(sig.r), bytes(sig.s), sig.sighashFlag]).toEqual([32, 32, '01']);
    expect(bytes(illustrativeSchnorrSig('k', 'd'))).toBe(64);
  });
});
