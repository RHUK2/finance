// 비트코인 소프트워(파워 프로젝션) 페이지의 순수 계산 모델을 한 곳에 모은다.
// 외부 API 없이 클라이언트에서 계산하며, 모든 수치는 개념 설명용 예시다.

import { mulberry32 } from "../bitcoin-game-theory/models";

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

// ── 1. 추상 권력 vs 물리 권력 (약탈자 포획) ────────────────────────────────
// 합리적 약탈자는 탈취 이득(value) > 탈취 비용일 때 공격한다.
//  - 추상 권력: 탈취 비용 = abstractDefense (위계·신뢰 매수 비용). 자산 가치에
//    비례해 오르지 않고 낮게 고정 → 고가치 자산일수록 BCRA가 커져 늘 노출된다.
//  - 물리 권력: 탈취 비용 = physicalWall (부과한 와트 = 실제 에너지 벽).
//    벽을 자산 가치 위로 올리면 BCRA<1이 되어 탈취가 비합리가 된다.
export type PowerCaptureInput = {
  value: number; // 자원 가치 (USD)
  abstractDefense: number; // 추상 권력 탈취 비용 (USD, 낮은 상한)
  physicalWall: number; // 물리 권력 벽 = 부과한 와트의 비용 (USD)
};

export function powerCapture({
  value,
  abstractDefense,
  physicalWall,
}: PowerCaptureInput) {
  const bcraAbstract = value / abstractDefense;
  const bcraPhysical = value / physicalWall;
  return {
    abstract: {
      cost: abstractDefense,
      bcra: bcraAbstract,
      captured: value > abstractDefense,
    },
    physical: {
      cost: physicalWall,
      bcra: bcraPhysical,
      captured: value > physicalWall,
    },
  };
}

// ── 2. 자연의 파워 프로젝션 (원시 경제학) ──────────────────────────────────
// 각 개체는 투사할 수 있는 물리력 power(=와트)를 갖는다. 포식 압력 P 아래에서는
// power < P인 개체가 도태되고, P 이상을 투사하는 개체만 살아남는다.
// 평화주의(미투사, power≈0)는 진화적으로 비싸다.
export type OrganismType = "평화주의자" | "약한 방어" | "강한 투사자";
export type Organism = { power: number; type: OrganismType };

function typeForPower(power: number): OrganismType {
  return power < 0.33 ? "평화주의자" : power < 0.66 ? "약한 방어" : "강한 투사자";
}

// meanPower(0~1): 개체군 평균 투사력. power를 [0, 2·mean]에 고르게 퍼뜨린다.
// seed로 재현 가능.
export function buildOrganisms(
  n: number,
  meanPower: number,
  seed: number,
): Organism[] {
  const rng = mulberry32(seed);
  return Array.from({ length: n }, () => {
    const power = clamp01(rng() * 2 * meanPower);
    return { power, type: typeForPower(power) };
  });
}

export type PredationState = {
  alive: boolean[];
  threshold: number; // 현재까지 도달한 포식 압력
  round: number;
  history: number[]; // 라운드별 생존율
};

const PREDATION_INC = 0.05; // 라운드마다 포식 압력이 차오르는 폭

export function initialPredationState(n: number): PredationState {
  return { alive: Array(n).fill(true), threshold: 0, round: 0, history: [1] };
}

// 한 라운드 진행: 포식 압력을 PREDATION_INC만큼 올리고, 그보다 약하게 투사하는
// 생존 개체를 도태시킨다. 압력이 목표 pressure에 도달하면 changed=false로 멈춘다.
export function predationStep(
  state: PredationState,
  organisms: Organism[],
  pressure: number,
): { next: PredationState; changed: boolean } {
  if (state.threshold >= pressure) {
    return { next: state, changed: false };
  }
  const nextThreshold = Math.min(pressure, state.threshold + PREDATION_INC);
  const alive = state.alive.map((a, i) =>
    a ? organisms[i].power >= nextThreshold : false,
  );
  const survivalRate = alive.filter(Boolean).length / organisms.length;
  return {
    next: {
      alive,
      threshold: nextThreshold,
      round: state.round + 1,
      history: [...state.history, survivalRate],
    },
    changed: true,
  };
}

// ── 3. 소프트워 vs 하드워 (BCRA 억지) ──────────────────────────────────────
// 적을 억지하려면 적의 BCRA(공격 이득 ÷ 투사 권력)를 1 미만으로 낮춰야 한다.
// 같은 억지를 하드워(유혈)는 인명·자산 파괴를 동반해 달성하지만, 소프트워(전기)는
// 인명 피해 0으로 달성한다.
export type DeterrenceInput = {
  projectedPower: number; // 투사 권력량 (0~100)
  adversaryBenefit: number; // 적의 공격 이득 (0~100)
};

const CASUALTY_K = 120; // 하드워에서 투사력 1단위당 환산 인명 피해(예시)

export function deterrence({
  projectedPower,
  adversaryBenefit,
}: DeterrenceInput) {
  const bcra = adversaryBenefit / projectedPower;
  return {
    bcra,
    deterred: projectedPower >= adversaryBenefit,
    hardCasualties: Math.round(projectedPower * CASUALTY_K),
    softCasualties: 0,
  };
}
