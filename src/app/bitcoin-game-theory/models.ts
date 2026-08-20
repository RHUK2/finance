// 비트코인 게임이론 페이지에 쓰이는 순수 계산 모델을 한 곳에 모은다.
// 외부 API 없이 클라이언트에서 계산하며, 모든 수치는 개념 설명용 예시다.

import { clamp01, mulberry32 } from '@/lib/utils';

// ── 1. 보수 행렬 (2인 채택 게임) ───────────────────────────────────────────
// 두 행위자가 '채택(A)' 또는 '관망(W)'을 고른다. 행 플레이어 기준 보수:
//   A,A = u-r       (둘 다 채택: 상승분 누림, 조기 리스크 차감)
//   A,W = u-r+f     (나만 일찍: 상승분 + 선점 우위 f)
//   W,A = -f        (나만 낙오: 페널티 f)
//   W,W = 0         (현상 유지)
// 우월전략 조건: u - r + f > 0  →  상대 선택과 무관하게 '채택'이 유리.
export type PayoffInput = { u: number; r: number; f: number };
export type Choice = 'A' | 'W';

export function payoffMatrix({ u, r, f }: PayoffInput) {
  const cell = (row: Choice, col: Choice): [number, number] => {
    const me = (m: Choice, o: Choice) => (m === 'A' ? (o === 'A' ? u - r : u - r + f) : o === 'A' ? -f : 0);
    return [me(row, col), me(col, row)];
  };

  const cells = {
    AA: cell('A', 'A'),
    AW: cell('A', 'W'),
    WA: cell('W', 'A'),
    WW: cell('W', 'W'),
  };

  // 채택 우월 판정 마진. 상대 선택과 무관하게 채택이 유리하면 > 0.
  const margin = u - r + f;
  const nash: keyof typeof cells = margin > 0 ? 'AA' : 'WW';
  const dominantStrategy: Choice | null = margin === 0 ? null : margin > 0 ? 'A' : 'W';

  return { cells, nash, dominantStrategy, margin };
}

// 2×2 행렬의 칸 위치 키. 첫째/둘째 전략의 의미(채택·관망, 협력·배신)는 게임마다 다르다.
export type CellKey = 'AA' | 'AW' | 'WA' | 'WW';
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
// 우월전략은 '배신'이라 내쉬 균형은 WW(1,1)이고, 협력 AA(3,3)보다 모두에게 나쁜
// 파레토 열등 결과로 수렴한다. 채택 게임과의 대비용.
export function prisonersDilemma(): { cells: PayoffCells; nash: CellKey } {
  return {
    cells: {
      AA: [3, 3], // 둘 다 협력
      AW: [0, 5], // 나만 협력 (호구)
      WA: [5, 0], // 나만 배신 (유혹)
      WW: [1, 1], // 둘 다 배신
    },
    nash: 'WW',
  };
}

// ── 2. 채택 캐스케이드 (Granovetter 임계값 모델) ──────────────────────────
// 각 에이전트는 임계값 θ를 갖고, "전체" 채택률 p ≥ θ가 되면 채택한다.
// 이웃·거리 개념은 없다. 공간적 전파가 아니라 임계값 분포가 캐스케이드를 만든다.
// (docs/adr/0001-cascade-global-threshold-model.md 참조)
export type AgentType = '개인' | '기업' | '국가';
export type CascadeAgent = { type: AgentType; threshold: number };

// 유형 구성비는 고정이다. 슬라이더가 인구 구성을 바꾸지 않고 임계값 분포만 밀어야
// "임계값 분포가 확산 속도를 결정한다"는 인과를 분리해 관찰할 수 있다.
// base~base+spread 구간이 유형끼리 겹치므로 얼리어답터 기업과 늦은 개인이 존재한다.
// 개인의 base가 0인 것은 의도다. 임계값이 0에 가까운 소수가 있어야 시드 몇 명이
// 만든 초기 채택률이 누군가의 임계값을 넘겨 연쇄에 불을 붙일 수 있다.
const TYPE_MIX: { type: AgentType; share: number; base: number; spread: number }[] = [
  { type: '개인', share: 0.6, base: 0, spread: 0.42 },
  { type: '기업', share: 0.3, base: 0.2, spread: 0.4 },
  { type: '국가', share: 0.1, base: 0.38, spread: 0.44 },
];

// TYPE_MIX가 만드는 임계값의 기대 평균. 슬라이더 값을 배율로 환산하는 기준점.
const BASE_MEAN = TYPE_MIX.reduce((sum, t) => sum + t.share * (t.base + t.spread / 2), 0);

// meanThreshold(0~1): 낮을수록 FOMO 민감(쉽게 채택). 유형별 분포를 통째로 배율
// 조정해 전체 평균이 meanThreshold에 맞도록 한다. 구성비와 유형 간 순서는 불변.
// 반환 배열은 임계값 오름차순으로 정렬돼 있어, 채택 집합이 항상 앞에서부터의
// 연속 구간(접두)이 된다. 격자를 이 순서로 그리면 경계 위치가 곧 채택률이다.
export function buildCascadeAgents(n: number, meanThreshold: number, seed: number): CascadeAgent[] {
  const rng = mulberry32(seed);
  const scale = meanThreshold / BASE_MEAN;
  const agents: CascadeAgent[] = [];
  TYPE_MIX.forEach((t, i) => {
    // 마지막 유형이 반올림 오차를 흡수해 합계를 n에 맞춘다.
    const count = i === TYPE_MIX.length - 1 ? n - agents.length : Math.round(n * t.share);
    for (let k = 0; k < count; k++) {
      agents.push({ type: t.type, threshold: clamp01((t.base + rng() * t.spread) * scale) });
    }
  });
  return agents.sort((a, b) => a.threshold - b.threshold);
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

// 라운드 수 안전장치. 두 캐스케이드 모두 유한 라운드에 수렴하지만, 파라미터를
// 잘못 넣어 수렴하지 않을 때 무한 루프 대신 잘린 궤적을 돌려준다.
const MAX_ROUNDS = 200;

// 한 프레임 = 한 라운드의 화면 상태. justChanged는 그 라운드에 새로 넘어온 칸.
export type CascadeFrame = { adopted: boolean[]; justChanged: boolean[]; p: number };

// 캐스케이드 전 궤적을 미리 계산한다. 모델이 결정론적(고정 시드, 난수 없음)이라
// 가능하며, 덕분에 라운드를 앞뒤로 왕복하고 최종 곡선을 첫 프레임부터 보여 줄 수 있다.
// 프레임 0은 시드 채택자만 있는 초기 상태다.
export function cascadeTrajectory(agents: CascadeAgent[], seedCount: number): CascadeFrame[] {
  const n = agents.length;
  // agents가 임계값 오름차순이므로 임계값이 가장 낮은 seedCount명 = 앞에서부터 seedCount개.
  const seeded = agents.map((_, i) => i < seedCount);
  const frames: CascadeFrame[] = [{ adopted: seeded, justChanged: [...seeded], p: seedCount / n }];
  for (let r = 0; r < MAX_ROUNDS; r++) {
    const prev = frames[frames.length - 1].adopted;
    const res = cascadeStep(agents, prev);
    if (!res.changed) break;
    frames.push({
      adopted: res.next,
      justChanged: res.next.map((a, i) => a && !prev[i]),
      p: res.next.filter(Boolean).length / n,
    });
  }
  return frames;
}

// ── 3. 홀더의 딜레마 (반사성 캐스케이드) ─────────────────────────────────
// 각 보유자는 확신도 c를 갖는다. 시작가 대비 누적 낙폭이 c를 넘으면 매도한다.
// 즉 확신도는 "견디는 최대 낙폭"이다. 매도는 가격을 더 끌어내리고, 그 하락이
// 더 높은 확신도까지 무너뜨린다. 캐스케이드와 마찬가지로 이웃 개념은 없다.
// 가격이라는 전역 신호만 공유한다.
export type HolderBand = '약한 손' | '일반 보유자' | '다이아몬드손';
export type Holder = { conviction: number; band: HolderBand };
export type HodlState = {
  price: number;
  sold: boolean[];
  drawdown: number; // 시작가 대비 누적 낙폭 (0~1)
  newSellers: number;
  round: number;
};

const START_PRICE = 100;
const SELL_IMPACT = 0.5; // 한 라운드 전량 매도 시 -50%

// 확신도 구간 이름. 캐스케이드의 개인·기업·국가와 같은 읽는 법을 준다.
export function holderBand(conviction: number): HolderBand {
  return conviction < 0.4 ? '약한 손' : conviction < 0.7 ? '일반 보유자' : '다이아몬드손';
}

// 확신도 분포는 종 모양이어야 한다. 균등분포에서는 되먹임 이득이 구간마다 같아서
// 전원 붕괴 아니면 전원 생존 둘뿐이고 중간이 원리적으로 존재하지 않는다. 밀도가
// 가운데서 높고 양 끝에서 낮아야 연쇄가 약한 손을 훑고 지나가다 다이아몬드손
// 밀도 벽에서 스스로 멈춘다. 균등난수 3개의 합으로 종 모양을 근사한다.
// 확신도 오름차순 정렬이라 매도 집합도 항상 앞에서부터의 연속 구간(접두)이 된다.
const CONVICTION_SPREAD = 0.5;

export function buildHolders(n: number, meanConviction: number, seed: number): Holder[] {
  const rng = mulberry32(seed + 1);
  return Array.from({ length: n }, () => {
    const bell = rng() + rng() + rng() - 1.5;
    const conviction = clamp01(meanConviction + bell * CONVICTION_SPREAD);
    return { conviction, band: holderBand(conviction) };
  }).sort((a, b) => a.conviction - b.conviction);
}

export function initialHodlState(n: number): HodlState {
  return {
    price: START_PRICE,
    sold: Array(n).fill(false),
    drawdown: 0,
    newSellers: 0,
    round: 0,
  };
}

// 한 라운드 진행. shock: 외생 하락 비율(0~1), 없으면 0.
// 충격을 먼저 반영해 누적 낙폭을 갱신하고, 그 낙폭으로 매도를 판정한 뒤,
// 매도 압력이 가격을 한 번 더 끌어내린다. 가격은 단조 하락이므로 누적 낙폭이
// 곧 지금까지의 최대 낙폭이고, 매도 집합은 확신도 순으로 앞에서부터 늘어난다.
export function hodlStep(state: HodlState, holders: Holder[], shock = 0): HodlState {
  const n = holders.length;
  const shocked = state.price * (1 - shock);
  const drawdown = 1 - shocked / START_PRICE;

  let newSellers = 0;
  const sold = state.sold.map((s, i) => {
    if (s) return true;
    if (drawdown >= holders[i].conviction) {
      newSellers++;
      return true;
    }
    return false;
  });

  const price = shocked * (1 - (newSellers / n) * SELL_IMPACT);

  return {
    price,
    sold,
    drawdown: 1 - price / START_PRICE,
    newSellers,
    round: state.round + 1,
  };
}

export type HodlFrame = { state: HodlState; justChanged: boolean[] };

// 홀더 딜레마 전 궤적. 프레임 0은 충격 이전의 평온한 초기 상태이고,
// 프레임 1에서 외생 충격이 가해진 뒤 새 매도가 끊길 때까지 전파만 이어진다.
export function hodlTrajectory(holders: Holder[], shock: number): HodlFrame[] {
  const n = holders.length;
  const frames: HodlFrame[] = [{ state: initialHodlState(n), justChanged: Array(n).fill(false) }];
  for (let r = 0; r < MAX_ROUNDS; r++) {
    const prev = frames[frames.length - 1].state;
    const shockNow = prev.round === 0 ? shock : 0;
    const next = hodlStep(prev, holders, shockNow);
    // 외생 충격도 없고 새 매도도 없으면 가격·보유 상태가 그대로다. 연쇄 종료.
    if (shockNow === 0 && next.newSellers === 0) break;
    frames.push({ state: next, justChanged: next.sold.map((s, i) => s && !prev.sold[i]) });
  }
  return frames;
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

export function attack51({ btcPrice, networkHashrate, attackHours, hardwareCostPerTH, electricity }: AttackInput) {
  const requiredTH = networkHashrate * 1e6; // EH/s → TH/s (과반=네트워크 동급)
  const hardwareCost = requiredTH * hardwareCostPerTH;
  const powerKW = (requiredTH * J_PER_TH) / 1000;
  const energyCost = powerKW * attackHours * electricity;
  const attackCost = hardwareCost + energyCost;

  const doubleSpendGain = DOUBLE_SPEND_BTC * btcPrice;
  // 같은 장비로 정직하게 채굴했을 때 공격 시간 동안의 기대 수익(과반=50%)
  const honestRevenue = BLOCK_REWARD * BLOCKS_PER_HOUR * attackHours * 0.5 * btcPrice;

  const costToGain = attackCost / doubleSpendGain;

  return {
    hardwareCost,
    energyCost,
    attackCost,
    doubleSpendGain,
    honestRevenue,
    costToGain,
  };
}
