import { describe, expect, it } from 'vitest';

import { ADDRESS_TYPES } from './address-types';
import {
  ENTROPY_OPTIONS,
  entropyBreakdown,
  entropyToMnemonic,
  illustrativeAddress,
  illustrativeHex,
  PURPOSES,
} from './bip-concept';
import { BIP39_WORDLIST } from './bip39-wordlist';

// 기대값은 docs/fact-check-log.md 「BIP-39」「BIP-32 / 44」다.
describe('BIP-39', () => {
  it.each([
    [128, 4, 12],
    [160, 5, 15],
    [192, 6, 18],
    [224, 7, 21],
    [256, 8, 24],
  ])('ENT %i → CS %i, 단어 %i개', (bits, checksum, words) => {
    expect(entropyBreakdown(bits)).toEqual({ entropy: bits, checksum, total: bits + checksum, words });
  });

  it('엔트로피 선택지는 128~256비트다', () => {
    expect([...ENTROPY_OPTIONS]).toEqual([128, 160, 192, 224, 256]);
  });

  it('단어장은 실제 영어 목록 2048개다', () => {
    expect(BIP39_WORDLIST).toHaveLength(2048);
    expect(BIP39_WORDLIST[0]).toBe('abandon');
    expect(BIP39_WORDLIST[2047]).toBe('zoo');
    expect(new Set(BIP39_WORDLIST).size).toBe(2048);
  });

  // 지갑 키 화면의 초기 엔트로피(wallet-keys-view.tsx)에서 나오는 12단어를 원문 규칙으로 대조한 값.
  it('초기 엔트로피의 12개 인덱스와 단어', () => {
    const words = entropyToMnemonic(illustrativeHex('genesis', 32));
    expect(words.map((w) => [w.index, w.word])).toEqual([
      [125, 'autumn'],
      [601, 'enroll'],
      [1878, 'turn'],
      [874, 'hood'],
      [900, 'identify'],
      [171, 'betray'],
      [1410, 'raccoon'],
      [288, 'catch'],
      [706, 'flame'],
      [1264, 'own'],
      [1149, 'moral'],
      [927, 'initial'],
    ]);
  });

  it('체크섬 비트가 걸치는 단어는 마지막 하나다 (128비트)', () => {
    const words = entropyToMnemonic(illustrativeHex('genesis', 32));
    expect(words.map((w) => w.isChecksum)).toEqual([...Array(11).fill(false), true]);
    expect(words.every((w) => w.bits.length === 11 && parseInt(w.bits, 2) === w.index)).toBe(true);
  });
});

describe('BIP-44 purpose와 주소 모양', () => {
  it("purpose 44'/49'/84'/86' ↔ P2PKH / P2SH-P2WPKH / P2WPKH / P2TR", () => {
    expect(PURPOSES.map((p) => [p.value, p.addr])).toEqual([
      ['44', 'P2PKH'],
      ['49', 'P2SH-P2WPKH'],
      ['84', 'P2WPKH'],
      ['86', 'P2TR'],
    ]);
    expect(ADDRESS_TYPES.map((t) => t.purpose)).toEqual(["44'", "49'", "84'", "86'"]);
  });

  it.each([
    ['44', '1', 34],
    ['49', '3', 34],
    ['84', 'bc1q', 42],
    ['86', 'bc1p', 62],
  ])("purpose %s' → 접두어 %s, 총 %i자", (purpose, prefix, length) => {
    const addr = illustrativeAddress('seed', "m / 0' / 0", purpose);
    expect(addr.startsWith(prefix)).toBe(true);
    expect(addr).toHaveLength(length);
  });

  it('base58은 0·O·I·l을 쓰지 않고, bech32 본문은 32자 문자셋 안에 있다', () => {
    const BECH32 = new Set('qpzry9x8gf2tvdw0s3jn54khce6mua7l');
    expect(BECH32.size).toBe(32);
    for (let i = 0; i < 50; i++) {
      const legacy = illustrativeAddress(`seed${i}`, 'p', '44');
      expect(legacy).not.toMatch(/[0OIl]/);
      expect(legacy).toMatch(/^[1-9A-HJ-NP-Za-km-z]+$/);
      const native = illustrativeAddress(`seed${i}`, 'p', '84');
      expect([...native.slice(4)].every((c) => BECH32.has(c))).toBe(true);
    }
  });
});
