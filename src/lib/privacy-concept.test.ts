import { describe, expect, it } from 'vitest';

import { anonymityChance, walletAddress } from './privacy-concept';

describe('CoinJoin 익명 집합', () => {
  // docs/fact-check-log.md 「라이트닝·프라이버시」: 참가자 N에 대해 1/N.
  it.each([1, 2, 5, 100])('참가자 %i명 → 1/N', (n) => {
    expect(anonymityChance(n) * n).toBeCloseTo(1, 12);
  });
});

describe('walletAddress', () => {
  it('같은 라벨이면 같은 주소, purpose를 따라 접두어가 바뀐다', () => {
    expect(walletAddress('alice')).toBe(walletAddress('alice'));
    expect(walletAddress('alice')).not.toBe(walletAddress('bob'));
    expect(walletAddress('alice').startsWith('bc1q')).toBe(true);
    expect(walletAddress('alice', '86').startsWith('bc1p')).toBe(true);
  });
});
