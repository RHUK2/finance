import { describe, expect, it } from 'vitest';

import { canReplaceByFee, generateGossipGraph, graphHopDistances, HEADER_BYTES, headersBytes } from './p2p-concept';

// 기대값은 docs/fact-check-log.md 「P2P」다.
describe('블록 헤더', () => {
  it('80바이트 고정', () => {
    expect(HEADER_BYTES).toBe(80);
    expect(headersBytes(1_000)).toBe(80_000);
  });
});

describe('canReplaceByFee (BIP125 규칙 3·4)', () => {
  it('규칙 3: 절대 수수료가 원본보다 커야 한다', () => {
    expect(canReplaceByFee(1_000, 1_000, 200, 0).accepted).toBe(false);
    expect(canReplaceByFee(1_000, 900, 200, 0).accepted).toBe(false);
    expect(canReplaceByFee(1_000, 1_001, 200, 0).accepted).toBe(true);
  });

  it('규칙 4: 증분이 최소 릴레이 수수료율 × 대체 tx 크기 이상이어야 한다', () => {
    expect(canReplaceByFee(1_000, 1_199, 200, 1)).toEqual({ accepted: false, feeDelta: 199, requiredDelta: 200 });
    expect(canReplaceByFee(1_000, 1_200, 200, 1)).toEqual({ accepted: true, feeDelta: 200, requiredDelta: 200 });
  });

  it('요구 증분은 사토시 정수로 올림한다', () => {
    expect(canReplaceByFee(1_000, 1_141, 140.5, 1)).toMatchObject({ accepted: true, requiredDelta: 141 });
    expect(canReplaceByFee(1_000, 1_140, 140.5, 1).accepted).toBe(false);
  });
});

describe('generateGossipGraph', () => {
  it('스패닝 트리를 깔고 시작하므로 모든 노드에 닿는다', () => {
    for (const seed of [1, 2, 3, 42]) {
      const g = generateGossipGraph(40, 4, seed);
      const dist = graphHopDistances(g.adjacency, 0);
      expect(dist.every((d) => Number.isFinite(d) && d >= 0)).toBe(true);
    }
  });
});
