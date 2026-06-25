// 비트코인 게임이론 페이지에 쓰이는 순수 계산 모델을 한 곳에 모은다.
// 외부 API 없이 클라이언트에서 계산하며, 모든 수치는 개념 설명용 예시다.

// ── 공용: 시드 기반 난수 (리셋 시 동일 결과 재현) ───────────────────────────
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

// ── 1. 보수 행렬 (2인 채택 게임) ───────────────────────────────────────────
// 두 행위자가 '채택(A)' 또는 '관망(W)'을 고른다. 행 플레이어 기준 보수:
//   A,A = u-r       (둘 다 채택: 상승분 누림, 조기 리스크 차감)
//   A,W = u-r+f     (나만 일찍: 상승분 + 선점 우위 f)
//   W,A = -f        (나만 낙오: 페널티 f)
//   W,W = 0         (현상 유지)
// 우월전략 조건: u - r + f > 0  →  상대 선택과 무관하게 '채택'이 유리.
export type PayoffInput = { u: number; r: number; f: number };
export type Choice = "A" | "W";

export function payoffMatrix({ u, r, f }: PayoffInput) {
  const cell = (row: Choice, col: Choice): [number, number] => {
    const me = (m: Choice, o: Choice) =>
      m === "A" ? (o === "A" ? u - r : u - r + f) : o === "A" ? -f : 0;
    return [me(row, col), me(col, row)];
  };

  const cells = {
    AA: cell("A", "A"),
    AW: cell("A", "W"),
    WA: cell("W", "A"),
    WW: cell("W", "W"),
  };

  // 채택이 우월전략인가? (상대가 A든 W든 채택이 더 큰 보수)
  const adoptDominant = u - r + f > 0;
  const nash: keyof typeof cells = adoptDominant ? "AA" : "WW";
  const dominantStrategy: Choice | null =
    u - r + f === 0 ? null : adoptDominant ? "A" : "W";

  return { cells, nash, dominantStrategy };
}

// ── 2. 채택 캐스케이드 (Granovetter 임계값 모델) ──────────────────────────
// 각 에이전트는 임계값 θ를 갖고, 채택률 p ≥ θ가 되면 채택한다.
// 유형별 임계값: 개인(낮음) < 기업 < 국가(높음).
export type AgentType = "개인" | "기업" | "국가";
export type CascadeAgent = { type: AgentType; threshold: number };

// 임계값으로 유형을 분류 — 낮은 임계값(먼저 채택)은 개인, 높은 쪽은 국가.
function typeForThreshold(threshold: number): AgentType {
  return threshold < 0.25 ? "개인" : threshold < 0.5 ? "기업" : "국가";
}

// meanThreshold(0~1): 낮을수록 FOMO 민감(쉽게 채택). 임계값을 [0, 2·mean]에 고르게
// 퍼뜨려 한 번 점화되면 채택률이 스스로를 끌어올리는 S자 캐스케이드를 만든다.
// seed로 재현 가능.
export function buildCascadeAgents(
  n: number,
  meanThreshold: number,
  seed: number,
): CascadeAgent[] {
  const rng = mulberry32(seed);
  return Array.from({ length: n }, () => {
    const threshold = clamp01(rng() * 2 * meanThreshold);
    return { type: typeForThreshold(threshold), threshold };
  });
}

// 한 라운드 진행: p ≥ θ인 미채택자를 채택으로 전환. 다음 상태와 변화 여부 반환.
export function cascadeStep(agents: CascadeAgent[], adopted: boolean[]) {
  const p = adopted.filter(Boolean).length / agents.length;
  let changed = false;
  const next = adopted.map((a, i) => {
    if (a) return true;
    if (p >= agents[i].threshold) {
      changed = true;
      return true;
    }
    return false;
  });
  return { next, changed, p };
}

// ── 3. 홀더의 딜레마 (반사성 캐스케이드) ─────────────────────────────────
// 각 보유자는 확신도 c를 갖는다. 직전 하락폭이 패닉 임계(=c*0.5)를 넘으면 매도.
// 약한 손(낮은 c)은 작은 하락에도 던지고, 매도는 추가 하락을 부른다.
export type Holder = { conviction: number };
export type HodlState = {
  price: number;
  sold: boolean[];
  lastDropPct: number; // 직전 라운드 하락 비율(양수=하락)
  newSellers: number;
  round: number;
};

const SELL_IMPACT = 0.6; // 한 라운드 전량 매도 시 -60%

export function buildHolders(
  n: number,
  meanConviction: number,
  seed: number,
): Holder[] {
  const rng = mulberry32(seed + 1);
  return Array.from({ length: n }, () => {
    const jitter = (rng() - 0.5) * 0.4;
    return { conviction: clamp01(meanConviction + jitter) };
  });
}

export function initialHodlState(n: number): HodlState {
  return { price: 100, sold: Array(n).fill(false), lastDropPct: 0, newSellers: 0, round: 0 };
}

// 한 라운드 진행. shock: 외생 하락 비율(0~1), 없으면 0.
export function hodlStep(state: HodlState, holders: Holder[], shock = 0): HodlState {
  const n = holders.length;
  // 직전 하락 + 이번 충격이 패닉 임계를 넘는 보유자가 매도
  const trigger = state.lastDropPct + shock;
  let newSellers = 0;
  const sold = state.sold.map((s, i) => {
    if (s) return true;
    if (trigger >= holders[i].conviction * 0.5 && trigger > 0) {
      newSellers++;
      return true;
    }
    return false;
  });

  const sellPressure = (newSellers / n) * SELL_IMPACT;
  const drop = shock + sellPressure;
  // 매도가 가격을 더 끌어내리고(반사성), 그 하락이 다음 라운드 패닉을 부른다.
  // 새 매도가 끊기면 lastDropPct=0이 되어 연쇄가 멈춘다.
  const nextPrice = drop > 0 ? state.price * (1 - drop) : state.price;

  return { price: nextPrice, sold, lastDropPct: drop, newSellers, round: state.round + 1 };
}

// ── 4. 51% 공격 보안 게임 ────────────────────────────────────────────────
// 네트워크 과반 해시파워 확보·운영 비용 vs 이중지불 이득 vs 정직 채굴 수익.
export type AttackInput = {
  btcPrice: number; // USD
  networkHashrate: number; // EH/s
  attackHours: number;
  hardwareCostPerTH: number; // USD per TH/s
  electricity: number; // USD per kWh
};

const J_PER_TH = 20; // 최신 ASIC 효율 ≈ 20 J/TH → 20 W per TH/s
const BLOCK_REWARD = 3.125; // BTC
const BLOCKS_PER_HOUR = 6;
const DOUBLE_SPEND_BTC = 5000; // 현실적으로 노릴 수 있는 이중지불 규모(예시 상한)

export function attack51({
  btcPrice,
  networkHashrate,
  attackHours,
  hardwareCostPerTH,
  electricity,
}: AttackInput) {
  const requiredTH = networkHashrate * 1e6; // EH/s → TH/s (과반=네트워크 동급)
  const hardwareCost = requiredTH * hardwareCostPerTH;
  const powerKW = (requiredTH * J_PER_TH) / 1000;
  const energyCost = powerKW * attackHours * electricity;
  const attackCost = hardwareCost + energyCost;

  const doubleSpendGain = DOUBLE_SPEND_BTC * btcPrice;
  // 같은 장비로 정직하게 채굴했을 때 공격 시간 동안의 기대 수익(과반=50%)
  const honestRevenue =
    BLOCK_REWARD * BLOCKS_PER_HOUR * attackHours * 0.5 * btcPrice;

  const costToGain = attackCost / doubleSpendGain;

  return { hardwareCost, energyCost, attackCost, doubleSpendGain, honestRevenue, costToGain };
}
