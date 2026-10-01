import { describe, expect, it } from 'vitest';

import {
  addPt,
  bruteForce,
  CURVE_POINTS,
  lineCells,
  mod,
  mulPt,
  MULTIPLES_OF_G,
  N,
  P,
  type Pt,
  recoverFromReuse,
  samePt,
  sign,
  slope,
  verify,
} from './models';

const G = MULTIPLES_OF_G[1];
const onCurve = (pt: { x: number; y: number }) => mod(pt.y * pt.y, P) === mod(pt.x ** 3 + 7, P);

// ADR 0007: y² = x³ + 7 over p = 43. 아핀 점 30개, G의 위수 31.
describe('장난감 곡선', () => {
  it('아핀 점 30개가 모두 곡선 위에 있다', () => {
    expect(CURVE_POINTS).toHaveLength(30);
    expect(CURVE_POINTS.every(onCurve)).toBe(true);
  });

  it('G의 위수는 31이고, 1G~30G가 30개 점을 한 번씩 덮는다', () => {
    expect(N).toBe(31);
    expect(MULTIPLES_OF_G[0]).toBeNull();
    expect(MULTIPLES_OF_G[N]).toBeNull();
    const affine = MULTIPLES_OF_G.slice(1, N) as { x: number; y: number }[];
    expect(affine.every((pt) => pt !== null)).toBe(true);
    expect(new Set(affine.map((pt) => `${pt.x},${pt.y}`)).size).toBe(30);
  });

  it('스칼라 곱은 덧셈을 반복한 것과 같다', () => {
    let acc: Pt = null;
    for (let k = 0; k <= N; k++) {
      expect(samePt(mulPt(k, G), acc)).toBe(true);
      acc = addPt(acc, G);
    }
  });
});

// 티켓 15: 직선이 곡선과 만나는 세 번째 점은 (x₃, λ(x₃ − x_P) + y_P)이고, 합은 그 점을 x축에 뒤집은 것이다.
describe('점 덧셈', () => {
  it('기본값 3G + 5G: λ = 6, 6(32 − 35) + 21 ≡ 3, 합은 (32, 40)', () => {
    const p = mulPt(3, G)!;
    const q = mulPt(5, G)!;
    expect(p).toEqual({ x: 35, y: 21 });
    expect(slope(p, q)).toBe(6);
    expect(mod(6 * (32 - 35) + 21, P)).toBe(3);
    expect(addPt(p, q)).toEqual({ x: 32, y: 40 });
  });

  it('모든 쌍에서 세 번째 교점이 직선과 곡선 위에 있고, 합은 그 y를 뒤집은 것이다', () => {
    let checked = 0;
    for (const p of CURVE_POINTS) {
      for (const q of CURVE_POINTS) {
        const sum = addPt(p, q);
        const l = slope(p, q);
        if (sum === null) {
          expect(l).toBeNull();
          continue;
        }
        const third = { x: sum.x, y: mod(l! * (sum.x - p.x) + p.y, P) };
        expect(onCurve(third)).toBe(true);
        expect(mod(-third.y, P)).toBe(sum.y);
        expect(lineCells(p, q)).toContainEqual(third);
        checked++;
      }
    }
    expect(checked).toBe(30 * 30 - 30); // 30쌍만 P + (−P) = O
  });
});

describe('서명·검증', () => {
  // 티켓 14: s = 0인 서명은 실제 ECDSA처럼 검증 전에 거부한다.
  it('sign(7, 30, 11)은 s = 0이라 무효이고, verify가 거부한다', () => {
    const sig = sign(7, 30, 11);
    expect(sig).toMatchObject({ r: 9, s: 0, invalid: 's0' });
    expect(verify(mulPt(7, G), 30, 9, 0)).toEqual({ rejected: true, ok: false });
  });

  it('범위 밖 r·s는 거부한다', () => {
    const Q = mulPt(5, G);
    for (const [r, s] of [
      [0, 5],
      [N, 5],
      [5, 0],
      [5, N],
    ]) {
      expect(verify(Q, 10, r, s).rejected).toBe(true);
    }
  });

  it('d·k 전 조합에서 유효한 서명은 검증을 통과한다 (유효 27,000 · 무효 900)', () => {
    let valid = 0;
    let invalid = 0;
    for (let d = 1; d < N; d++) {
      const Q = mulPt(d, G);
      for (let z = 0; z < N; z++) {
        for (let k = 1; k < N; k++) {
          const sig = sign(d, z, k);
          if (sig.invalid) {
            invalid++;
            expect(verify(Q, z, sig.r, sig.s).ok).toBe(false);
            continue;
          }
          valid++;
          expect(verify(Q, z, sig.r, sig.s)).toMatchObject({ rejected: false, ok: true });
        }
      }
    }
    expect([valid, invalid]).toEqual([27_000, 900]);
  });

  it('다른 공개키로는 통과하지 않는다', () => {
    const sig = sign(4, 12, 9);
    expect(verify(mulPt(4, G), 12, sig.r, sig.s).ok).toBe(true);
    expect(verify(mulPt(5, G), 12, sig.r, sig.s).ok).toBe(false);
  });
});

describe('공격', () => {
  it('k를 재사용한 두 서명에서 k와 d를 되찾는다', () => {
    let recovered = 0;
    for (let d = 1; d < N; d++) {
      for (let k = 1; k < N; k++) {
        const a = sign(d, 13, k);
        const b = sign(d, 22, k);
        if (a.invalid || b.invalid) continue;
        expect(recoverFromReuse(13, a.s, 22, b.s, a.r)).toEqual({ k, d });
        recovered++;
      }
    }
    expect(recovered).toBeGreaterThan(0);
  });

  it('후보가 30개뿐이라 전수 대입으로 개인키가 나온다', () => {
    for (let d = 1; d < N; d++) expect(bruteForce(mulPt(d, G))).toBe(d);
  });
});
