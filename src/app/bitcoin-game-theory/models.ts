// 비트코인 게임이론 페이지에 쓰이는 순수 계산 모델을 한 곳에 모은다.
// 외부 API 없이 클라이언트에서 계산하며, 모든 수치는 개념 설명용 예시다.

import { clamp01, mulberry32 } from "@/lib/utils";

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

  // 채택 우월 판정 마진 — 상대 선택과 무관하게 채택이 유리하면 > 0.
  const margin = u - r + f;
  const nash: keyof typeof cells = margin > 0 ? "AA" : "WW";
  const dominantStrategy: Choice | null =
    margin === 0 ? null : margin > 0 ? "A" : "W";

  return { cells, nash, dominantStrategy, margin };
}

// 2×2 행렬의 칸 위치 키. 첫째/둘째 전략의 의미(채택·관망, 협력·배신)는 게임마다 다르다.
export type CellKey = "AA" | "AW" | "WA" | "WW";
export type PayoffCells = Record<CellKey, [number, number]>;
export type BestResponses = {
  meBest: Record<CellKey, boolean>;
  themBest: Record<CellKey, boolean>;
};

// 각 칸에서 두 플레이어의 최적대응(상대 선택을 고정했을 때 더 큰 보수) 여부.
// 행 플레이어는 같은 열에서 행을, 열 플레이어는 같은 행에서 열을 비교하므로
// 두 비교의 짝이 다르다. meBest/themBest가 동시에 true인 칸이 곧 내쉬 균형.
export function bestResponses(cells: PayoffCells): BestResponses {
  const meBest: Record<CellKey, boolean> = {
    AA: cells.AA[0] >= cells.WA[0], // 상대=첫째 열: 우리 첫째 vs 둘째
    WA: cells.WA[0] >= cells.AA[0],
    AW: cells.AW[0] >= cells.WW[0], // 상대=둘째 열: 우리 첫째 vs 둘째
    WW: cells.WW[0] >= cells.AW[0],
  };
  const themBest: Record<CellKey, boolean> = {
    AA: cells.AA[1] >= cells.AW[1], // 우리=첫째 행: 상대 첫째 vs 둘째
    AW: cells.AW[1] >= cells.AA[1],
    WA: cells.WA[1] >= cells.WW[1], // 우리=둘째 행: 상대 첫째 vs 둘째
    WW: cells.WW[1] >= cells.WA[1],
  };
  return { meBest, themBest };
}

// 정석 죄수의 딜레마. 행/열 첫째 = 협력(A 자리), 둘째 = 배신(W 자리).
// 우월전략은 '배신'이라 내쉬 균형은 WW(1,1) — 협력 AA(3,3)보다 모두에게 나쁜
// 파레토 열등 결과로 수렴한다. 채택 게임과의 대비용.
export function prisonersDilemma(): { cells: PayoffCells; nash: CellKey } {
  return {
    cells: {
      AA: [3, 3], // 둘 다 협력
      AW: [0, 5], // 나만 협력 (호구)
      WA: [5, 0], // 나만 배신 (유혹)
      WW: [1, 1], // 둘 다 배신
    },
    nash: "WW",
  };
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
