// ECDSA 페이지의 계산 모델. 이 페이지에서만 쓰므로 src/lib이 아니라 여기 둔다
// (CLAUDE.md "설명 페이지의 모델 배치").
//
// ⚠️ 이 파일은 저장소의 다른 암호 관련 모듈과 성격이 다르다. bip-concept·
// script-concept·block-concept은 실제 연산을 흉내만 낸 그럴듯한 가짜 값을 만들지만,
// 여기는 진짜 타원곡선 연산이다. 파라미터만 작을 뿐 계산은 실제 ECDSA와 같고,
// 그래서 독자가 손으로 검산할 수 있다. 두 종류를 한 화면에 섞지 않는 이유는
// docs/adr/0007 참조.
//
// 곡선은 secp256k1과 같은 모양(y² = x³ + 7)을 작은 소수체 위에 올린 것이다.
// p = 43을 고른 이유: 점이 30개뿐이라 격자에 전부 찍어도 안 빽빽하고 개인키
// 후보를 표로 다 늘어놓을 수 있으며, 위수 31이 소수라 무한원점이 아닌 어느 점을
// 골라도 생성점이 된다. 그리고 p > n이라 x좌표가 n을 넘어 접히는 일이 실제로
// 일어나는데, 이건 secp256k1에서도 똑같이 벌어지므로 단순화가 아니라 충실함이다.

export const P = 43;
export const B = 7;
export const N = 31;

export type Pt = { x: number; y: number } | null; // null = 무한원점

export const G: Pt = { x: 2, y: 12 };

export const mod = (a: number, m: number) => ((a % m) + m) % m;

// 페르마 소정리로 구하는 역원. m이 소수일 때만 맞고, 이 파일이 쓰는 P와 N 둘 다 소수다.
export function inv(a: number, m: number): number {
  let result = 1;
  let base = mod(a, m);
  let e = m - 2;
  while (e > 0) {
    if (e & 1) result = (result * base) % m;
    base = (base * base) % m;
    e >>= 1;
  }
  return result;
}

export function samePt(a: Pt, b: Pt): boolean {
  if (a === null || b === null) return a === b;
  return a.x === b.x && a.y === b.y;
}

export const fmtPt = (pt: Pt) => (pt === null ? 'O' : `(${pt.x}, ${pt.y})`);

// 두 점을 잇는 직선의 기울기. 같은 점이면 접선의 기울기다.
// 수직선(x가 같고 y가 부호만 다른 경우)에는 기울기가 없으므로 null.
export function slope(p1: Pt, p2: Pt): number | null {
  if (p1 === null || p2 === null) return null;
  if (p1.x === p2.x) {
    if (mod(p1.y + p2.y, P) === 0) return null; // 수직선 → 합이 무한원점
    return mod(3 * p1.x * p1.x * inv(2 * p1.y, P), P); // 접선
  }
  return mod((p2.y - p1.y) * inv(p2.x - p1.x, P), P);
}

export function addPt(p1: Pt, p2: Pt): Pt {
  if (p1 === null) return p2;
  if (p2 === null) return p1;
  const l = slope(p1, p2);
  if (l === null) return null;
  const x = mod(l * l - p1.x - p2.x, P);
  const y = mod(l * (p1.x - x) - p1.y, P);
  return { x, y };
}

export function mulPt(k: number, pt: Pt): Pt {
  let result: Pt = null;
  let addend = pt;
  let e = mod(k, N);
  while (e > 0) {
    if (e & 1) result = addPt(result, addend);
    addend = addPt(addend, addend);
    e >>= 1;
  }
  return result;
}

// 곡선 위의 점 전부. 무한원점은 좌표가 없으므로 여기 들어가지 않는다.
export const CURVE_POINTS: { x: number; y: number }[] = (() => {
  const pts: { x: number; y: number }[] = [];
  for (let x = 0; x < P; x++) {
    const rhs = mod(x * x * x + B, P);
    for (let y = 0; y < P; y++) if (mod(y * y, P) === rhs) pts.push({ x, y });
  }
  return pts;
})();

// k = 0..N. 양 끝(0과 N)은 무한원점이다.
export const MULTIPLES_OF_G: Pt[] = Array.from({ length: N + 1 }, (_, k) => mulPt(k, G));

// mod P에서 두 점을 잇는 직선이 지나는 칸 전부. 격자를 감으며 P개 칸을 지나고
// 그중 셋이 곡선 점(P, Q, 그리고 합의 x축 대칭점)이다. 그 감기는 모습을 눈으로
// 보이려고 좌표를 통째로 돌려준다.
export function lineCells(p1: Pt, p2: Pt): { x: number; y: number }[] {
  if (p1 === null || p2 === null) return [];
  const l = slope(p1, p2);
  // 수직선은 기울기가 없어 세로 한 줄을 통째로 지난다.
  if (l === null) return Array.from({ length: P }, (_, y) => ({ x: p1.x, y }));
  return Array.from({ length: P }, (_, x) => ({ x, y: mod(l * (x - p1.x) + p1.y, P) }));
}

// 스칼라 곱을 이중화-덧셈으로 풀어 쓴 자취. 30번 더하는 대신 다섯 번 안에 끝나는
// 것을 보이는 용도라, 실제 계산이 아니라 그 계산의 기록이다.
export function doubleAndAddSteps(k: number): { bit: number; acc: Pt; note: string }[] {
  const bits = mod(k, N).toString(2).split('').map(Number);
  const steps: { bit: number; acc: Pt; note: string }[] = [];
  let acc: Pt = null;
  bits.forEach((bit, i) => {
    if (i > 0) {
      acc = addPt(acc, acc);
      steps.push({ bit, acc, note: '두 배' });
    }
    if (bit === 1) {
      acc = addPt(acc, G);
      steps.push({ bit, acc, note: 'G 더하기' });
    }
  });
  return steps;
}

export type Signature = { R: Pt; r: number; s: number; invalid: 'r0' | 's0' | null };

// s = k⁻¹(z + r·d) mod n. r이나 s가 0이면 실제 ECDSA도 다른 k로 다시 서명하므로
// 값을 만들어 내지 않고 그 사실을 돌려준다.
export function sign(d: number, z: number, k: number): Signature {
  const R = mulPt(k, G);
  const r = R === null ? 0 : mod(R.x, N);
  if (r === 0) return { R, r, s: 0, invalid: 'r0' };
  const s = mod(inv(k, N) * mod(z + r * d, N), N);
  if (s === 0) return { R, r, s, invalid: 's0' };
  return { R, r, s, invalid: null };
}

export type Verification = { w: number; u1: number; u2: number; X: Pt; xModN: number | null; ok: boolean };

// 검증자가 쓰는 값은 공개키 Q, 해시 z, 서명 (r, s) 넷뿐이다. 개인키는 여기 없다.
export function verify(Q: Pt, z: number, r: number, s: number): Verification {
  const w = inv(s, N);
  const u1 = mod(z * w, N);
  const u2 = mod(r * w, N);
  const X = addPt(mulPt(u1, G), mulPt(u2, Q));
  const xModN = X === null ? null : mod(X.x, N);
  return { w, u1, u2, X, xModN, ok: xModN !== null && xModN === r };
}

// 같은 일회용 비밀값으로 만든 두 서명에서 k와 개인키를 되찾는다.
// s₁ − s₂ = k⁻¹(z₁ − z₂)에서 k가 먼저 나오고, 그 k를 서명식에 되넣으면 d가 나온다.
export function recoverFromReuse(
  z1: number,
  s1: number,
  z2: number,
  s2: number,
  r: number,
): { k: number; d: number } | null {
  const ds = mod(s1 - s2, N);
  if (ds === 0 || r === 0) return null;
  const k = mod(mod(z1 - z2, N) * inv(ds, N), N);
  const d = mod(mod(s1 * k - z1, N) * inv(r, N), N);
  return { k, d };
}

// 공개키에서 개인키를 전수 대입으로 찾는다. 후보가 30개뿐이라 즉시 끝난다.
export function bruteForce(Q: Pt): number | null {
  for (let d = 1; d < N; d++) if (samePt(MULTIPLES_OF_G[d], Q)) return d;
  return null;
}

// 실수 위의 y² = x³ + 7. 점 덧셈의 기하를 세우는 ①탭에서만 쓴다.
// 곡선이 x축과 만나는 곳은 x³ = −7, 즉 x = −∛7이다. 이 값을 소수로 반올림해 적으면
// 근보다 아주 조금 바깥이 되어 x³ + 7이 음수가 되고, 제곱근이 NaN이 되어 그림의
// 경로가 통째로 끊긴다. 그래서 상수로 적지 않고 계산한다.
export const REAL_CURVE_MIN_X = -Math.cbrt(B);

export function realCurveY(x: number): number {
  // 부동소수 오차로 근 부근에서 아주 작은 음수가 나올 수 있어 0으로 눌러 준다.
  return Math.sqrt(Math.max(0, x * x * x + B));
}

// 실수 곡선 위의 점 덧셈 예시. P=(−1, √6), Q=(2, √15)에서 직선을 그어 얻은 값이며
// 화면에 적는 숫자와 그림이 어긋나지 않도록 여기서 한 번에 계산한다.
export const REAL_EXAMPLE = (() => {
  const px = -1;
  const qx = 2;
  const py = realCurveY(px);
  const qy = realCurveY(qx);
  const l = (qy - py) / (qx - px);
  const rx = l * l - px - qx;
  const thirdY = l * (rx - px) + py;
  return { px, py, qx, qy, l, rx, thirdY, sumY: -thirdY };
})();

// 실제 secp256k1의 규모. ①탭에서 크기 비교로만 쓴다.
export const SECP256K1 = {
  equation: 'y² = x³ + 7',
  p: '2²⁵⁶ − 2³² − 977',
  n: '약 1.158 × 10⁷⁷',
  gx: '79BE667E F9DCBBAC 55A06295 CE870B07 …',
};
