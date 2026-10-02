import { describe, expect, it } from 'vitest';

import { ADDRESS_TYPES } from './address-types';
import {
  DICE_FOR_256,
  DIE_BITS,
  diceEntropyBits,
  ENTROPY_OPTIONS,
  entropyBreakdown,
  entropyToMnemonic,
  illustrativeAddress,
  illustrativeHex,
  MAX_CHILD_INDEX,
  parseChildIndex,
  PURPOSES,
  siblingIndices,
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

  // 체크섬 길이 CS ≡ ENT/32 (mod 11)이면 총비트가 11의 배수다. ENT/32는 그중 가장 짧은 값이다.
  it.each([...ENTROPY_OPTIONS])('ENT %i: CS = ENT/32가 총비트를 11의 배수로 맞추는 가장 짧은 체크섬', (bits) => {
    const fits = Array.from({ length: 32 }, (_, cs) => cs).filter((cs) => cs > 0 && (bits + cs) % 11 === 0);
    expect(fits[0]).toBe(bits / 32);
    expect(fits[1]).toBe(bits / 32 + 11);
  });

  it('주사위 1회는 log₂6 ≈ 2.58비트, 99회 약 255.9비트로 256 미만, 100회부터 넘는다', () => {
    expect(DIE_BITS).toBeCloseTo(2.585, 3);
    expect(diceEntropyBits(99)).toBeLessThan(256);
    expect(diceEntropyBits(99).toFixed(1)).toBe('255.9');
    expect(diceEntropyBits(100)).toBeGreaterThan(256);
    expect(DICE_FOR_256).toBe(100);
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

  it.each([
    ['44', /^[mn]/, 34],
    ['49', /^2/, 35],
    ['84', /^tb1q/, 42],
    ['86', /^tb1p/, 62],
  ])("coin 1'(Testnet)이면 purpose %s'의 주소가 테스트넷 모양이다", (purpose, prefix, length) => {
    for (let i = 0; i < 20; i++) {
      const addr = illustrativeAddress(`seed${i}`, `m / ${purpose}' / 1' / 0' / 0 / ${i}`, purpose, '1');
      expect(addr).toMatch(prefix);
      expect(addr).toHaveLength(length);
    }
  });

  it('coin을 주지 않으면 메인넷 모양이다', () => {
    expect(illustrativeAddress('seed', 'p', '84')).toBe(illustrativeAddress('seed', 'p', '84', '0'));
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

describe('BIP-32 경로 index', () => {
  it('일반 가지의 최댓값은 2³¹ − 1이다', () => {
    expect(MAX_CHILD_INDEX).toBe(2_147_483_647);
    expect(parseChildIndex('2147483647')).toBe(2_147_483_647);
    expect(parseChildIndex('2147483648')).toBeNull();
  });

  it('0 이상 정수만 받는다: 소수·음수·지수 표기·빈칸은 거부', () => {
    expect(parseChildIndex('0')).toBe(0);
    expect(parseChildIndex(' 42 ')).toBe(42);
    for (const bad of ['1.5', '1.0', '-1', '-0', '1e3', '', ' ', 'abc', '0x10']) {
      expect(parseChildIndex(bad)).toBeNull();
    }
  });

  it('형제 세 칸은 고른 번호를 가운데에 두고, 양 끝에서는 범위 안으로 민다', () => {
    expect(siblingIndices(5)).toEqual([4, 5, 6]);
    expect(siblingIndices(0)).toEqual([0, 1, 2]);
    expect(siblingIndices(MAX_CHILD_INDEX)).toEqual([MAX_CHILD_INDEX - 2, MAX_CHILD_INDEX - 1, MAX_CHILD_INDEX]);
    expect(siblingIndices(MAX_CHILD_INDEX - 1)).toEqual([MAX_CHILD_INDEX - 2, MAX_CHILD_INDEX - 1, MAX_CHILD_INDEX]);
  });
});
