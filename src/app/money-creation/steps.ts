// 신용창조 사슬을 단계별로 기술하는 데이터 모델.
// 외부 데이터 없이 개념용 예시 숫자(기준 B = 100)로만 계산한다.
// 통화량 정의: M0(본원통화) = 시중은행 지급준비금, M2(광의통화) = 국민 예금.
// 정부예금(TGA)은 통화량에서 제외된다.

export type Side = "asset" | "liability";
export type EntityId = "gov" | "fed" | "bank" | "public";

export type Op = {
  entity: EntityId;
  side: Side;
  item: string;
  delta: number;
  /** 이 단계에서 "무에서" 새로 생성된 항목(강조 대상) */
  created?: boolean;
};

export type Step = {
  id: string;
  title: string;
  narration: string;
  ops: Op[];
};

export const ENTITIES: { id: EntityId; name: string; sub: string }[] = [
  { id: "gov", name: "정부", sub: "재무부" },
  { id: "fed", name: "연준", sub: "중앙은행" },
  { id: "bank", name: "시중은행", sub: "상업은행" },
  { id: "public", name: "국민", sub: "가계·기업" },
];

// 대차대조표 행의 표시 순서(처음 등장 순)
const ITEM_ORDER = ["국채", "지급준비금", "대출", "정부예금", "예금", "자본"];

const round = (n: number) => Math.round(n);

/**
 * 지급준비율 r(0~1)에 따라 6단계 시나리오를 생성한다.
 * r은 4·5단계(은행 신용창조·통화승수)에만 영향을 준다.
 */
export function buildSteps(r: number): Step[] {
  const B = 100; // 기준 단위
  const L1 = round(B * (1 - r)); // 첫 대출(= 1차 재대출)
  const Mmax = round(B / r); // 최대 통화량(본원통화 × 1/r)
  const loanTotal = Mmax - B; // 누적 대출 총액
  const pct = Math.round(r * 100);
  const mult = (1 / r).toFixed(1);

  return [
    {
      id: "init",
      title: "초기 상태",
      narration:
        "모든 대차대조표가 비어 있다. 본원통화(M0)도 통화량(M2)도 0이다. 이제 돈이 어떻게 무(無)에서 만들어지는지 한 단계씩 따라가 보자.",
      ops: [],
    },
    {
      id: "issue",
      title: "정부, 국채 발행 → 은행 매입",
      narration:
        "정부가 적자지출 재원을 마련하려 국채를 발행하고 은행이 이를 매입한다. 은행은 정부 계좌에 예금을 적어주고 국채를 받는다. 정부예금(TGA)은 통화량에 포함되지 않으므로 아직 새 돈은 없다 — 정부가 빚을 졌을 뿐이다.",
      ops: [
        { entity: "gov", side: "asset", item: "정부예금", delta: B },
        { entity: "gov", side: "liability", item: "국채", delta: B },
        { entity: "bank", side: "asset", item: "국채", delta: B },
        { entity: "bank", side: "liability", item: "정부예금", delta: B },
      ],
    },
    {
      id: "qe",
      title: "연준, 국채 매입 (공개시장조작·QE)",
      narration:
        "연준이 은행에서 국채를 사들인다. 그 대금으로 연준은 지급준비금을 키보드로 적어넣어 무에서 창조한다 — 자산(국채)과 부채(지준)가 동시에 생겨난다. 이것이 본원통화(M0)의 탄생이다.",
      ops: [
        { entity: "fed", side: "asset", item: "국채", delta: B, created: true },
        {
          entity: "fed",
          side: "liability",
          item: "지급준비금",
          delta: B,
          created: true,
        },
        { entity: "bank", side: "asset", item: "국채", delta: -B },
        { entity: "bank", side: "asset", item: "지급준비금", delta: B },
      ],
    },
    {
      id: "spend",
      title: "정부 지출 → 국민에게 지급",
      narration:
        "정부가 지출하면 정부예금이 국민의 예금으로 바뀐다. 정부의 순자산은 그만큼 마이너스(빚)가 되고, 바로 그 금액이 국민의 새 돈(M2)이 된다. 정부 적자는 곧 민간의 자산이다.",
      ops: [
        { entity: "gov", side: "asset", item: "정부예금", delta: -B },
        { entity: "gov", side: "liability", item: "자본", delta: -B },
        { entity: "bank", side: "liability", item: "정부예금", delta: -B },
        { entity: "bank", side: "liability", item: "예금", delta: B },
        { entity: "public", side: "asset", item: "예금", delta: B },
        { entity: "public", side: "liability", item: "자본", delta: B },
      ],
    },
    {
      id: "loan",
      title: "은행, 대출 실행 (신용창조)",
      narration: `은행이 국민에게 ${L1}을 대출한다. 이때 은행은 보유한 돈을 빌려주는 게 아니라 예금을 새로 창조한다 — 대출(자산)과 예금(부채)이 동시에 생긴다. 지급준비금은 사후에 조달할 뿐이다. (지급준비율 ${pct}% 가정)`,
      ops: [
        {
          entity: "bank",
          side: "asset",
          item: "대출",
          delta: L1,
          created: true,
        },
        {
          entity: "bank",
          side: "liability",
          item: "예금",
          delta: L1,
          created: true,
        },
        { entity: "public", side: "asset", item: "예금", delta: L1 },
        { entity: "public", side: "liability", item: "대출", delta: L1 },
      ],
    },
    {
      id: "multiplier",
      title: "통화승수 (재예치·재대출 반복)",
      narration: `대출금이 다시 예치되고 또 대출되는 과정이 반복된다. 지급준비율 ${pct}%에서 통화량은 본원통화의 ${mult}배까지 확장된다. 아래 슬라이더로 지급준비율을 바꿔 승수가 어떻게 달라지는지 확인해 보라.`,
      ops: [
        { entity: "bank", side: "asset", item: "대출", delta: loanTotal - L1 },
        {
          entity: "bank",
          side: "liability",
          item: "예금",
          delta: Mmax - B - L1,
        },
        { entity: "public", side: "asset", item: "예금", delta: Mmax - B - L1 },
        {
          entity: "public",
          side: "liability",
          item: "대출",
          delta: loanTotal - L1,
        },
      ],
    },
  ];
}

export type Line = {
  item: string;
  amount: number;
  created: boolean;
  flowChanged: boolean;
};
export type Sheet = { asset: Line[]; liability: Line[] };

function emptySheets(): Record<EntityId, Sheet> {
  return {
    gov: { asset: [], liability: [] },
    fed: { asset: [], liability: [] },
    bank: { asset: [], liability: [] },
    public: { asset: [], liability: [] },
  };
}

/** 0~stepIndex 단계를 누적해 각 주체의 대차대조표를 만든다. */
export function sheetsAt(
  steps: Step[],
  stepIndex: number,
): Record<EntityId, Sheet> {
  const amounts = new Map<string, number>();
  for (let i = 0; i <= stepIndex; i++) {
    for (const op of steps[i].ops) {
      const key = `${op.entity}|${op.side}|${op.item}`;
      amounts.set(key, (amounts.get(key) ?? 0) + op.delta);
    }
  }
  // 현재 단계에서 새로 생성된 항목(amber 강조)과
  // 이미 있던 돈이 이동·변환된 항목(sky 강조)을 구분해 표시한다.
  // 흐름 변경은 자동 감지: 이번 단계에 유출(delta<0)이 있으면,
  // 그 단계에서 건드린 비-생성 항목을 이동·변환으로 본다.
  const createdNow = new Set<string>();
  const touchedNow = new Set<string>();
  let hasOutflow = false;
  for (const op of steps[stepIndex].ops) {
    const key = `${op.entity}|${op.side}|${op.item}`;
    if (op.created) {
      createdNow.add(key);
    } else {
      touchedNow.add(key);
      if (op.delta < 0) hasOutflow = true;
    }
  }

  const result = emptySheets();
  for (const { id } of ENTITIES) {
    for (const side of ["asset", "liability"] as const) {
      const lines: Line[] = [];
      for (const item of ITEM_ORDER) {
        const key = `${id}|${side}|${item}`;
        const amount = amounts.get(key) ?? 0;
        if (amount === 0) continue;
        lines.push({
          item,
          amount,
          created: createdNow.has(key),
          flowChanged: hasOutflow && touchedNow.has(key) && !createdNow.has(key),
        });
      }
      result[id][side] = lines;
    }
  }
  return result;
}

export type Metrics = { m0: number; m2: number; multiplier: number };

/** 본원통화·통화량·승수 지표 계산 */
export function metricsAt(steps: Step[], stepIndex: number): Metrics {
  const sheets = sheetsAt(steps, stepIndex);
  const sum = (lines: Line[], item: string) =>
    lines.find((l) => l.item === item)?.amount ?? 0;
  const m0 = sum(sheets.bank.asset, "지급준비금");
  const m2 = sum(sheets.public.asset, "예금");
  return { m0, m2, multiplier: m0 > 0 ? m2 / m0 : 0 };
}
