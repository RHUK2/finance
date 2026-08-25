// 달러 패권 페이지의 순수 계산 모델. 외부 API를 쓰지 않는다.
//
// 이탈 유인 비율은 이득 ÷ 비용이고 기준선은 1이다. BCRA(src/lib/bcra.ts)와 방향과
// 기준선은 같지만 이탈은 공격이 아니므로 이름을 갈라 둔다(docs/adr/0004 참조).

import { clamp } from '@/lib/utils';

// 화면에 쓰는 정책·통계 수치는 값과 기준 시점을 한 객체에 묶어 단일 출처로 둔다.
// 기준 없는 수치는 몇 년 뒤 조용히 틀린 문서가 된다.
export type Fact = { value: number; label: string; asOf: string; source: string };

export const FACTS = {
  reserveShare: {
    value: 0.575,
    label: '세계 외환보유고 중 달러 비중',
    asOf: '2024년 4분기',
    source: 'IMF COFER',
  },
  federalDebt: {
    value: 36,
    label: '미국 연방정부 총부채 (조 달러)',
    asOf: '2025년 1분기',
    source: '미국 재무부',
  },
} satisfies Record<string, Fact>;

// ─────────────────────────────────────────────────────────────
// 탭 1. 수요원의 교체
//
// 1971년 이전의 금은 태환 청구권이 붙은 담보였고, 그 뒤의 석유는 담보가 아니라
// 결제통화 고정이 만든 강제 수요다. 용어가 갈리는 지점이 곧 닉슨 쇼크라서,
// 그 갈림 자체를 2단계의 내용으로 쓴다.
// ─────────────────────────────────────────────────────────────

export type DemandStage = {
  id: string;
  era: string;
  title: string;
  kind: '담보' | '수요원';
  anchor: string;
  claimable: boolean;
  claimNote: string;
  narration: string;
  broke: string;
};

export const DEMAND_STAGES: DemandStage[] = [
  {
    id: 'gold',
    era: '1944 ~ 1971',
    title: '금이 담보이던 시절',
    kind: '담보',
    anchor: '금 1온스 = 35달러',
    claimable: true,
    claimNote: '각국 중앙은행이 달러를 들고 와 금으로 바꿔 달라고 청구할 수 있었다',
    narration:
      '2차대전 중 전쟁 물자를 양쪽에 팔며 미국이 세계 금의 약 70%를 쌓았다. 브레턴우즈 체제는 그 금을 온스당 35달러에 고정했고, 달러는 사실상 금 보관증이었다. 이 단계에서 달러를 받아 두는 이유는 담보라고 불러도 정확하다. 청구하면 실제로 금이 나왔기 때문이다.',
    broke:
      '베트남전 비용으로 달러를 과다 발행하자 각국이 동시에 금 태환을 요구했다. 금고에 있는 금보다 발행한 달러가 많았다.',
  },
  {
    id: 'oil',
    era: '1971 ~ 2000년대',
    title: '담보가 사라지고 수요가 대신했다',
    kind: '수요원',
    anchor: '석유 결제는 달러로만',
    claimable: false,
    claimNote: '달러를 들고 가서 석유로 바꿔 달라고 청구할 수 있는 곳은 없다',
    narration:
      '1971년 닉슨이 금 태환을 중단하면서 담보가 없어졌다. 1973~74년 미국은 사우디에 군사 보호를 주고 석유 결제를 달러로만 하기로 합의했고 OPEC이 뒤따랐다. 여기서 용어를 갈아야 한다. 석유는 담보가 아니다. 아무도 달러를 석유로 태환할 수 없다. 석유가 한 일은 결제통화를 고정해 달러를 사야만 하게 만든 것, 즉 담보가 아니라 강제된 수요다. 이 구분이 이 페이지 전체의 답이다. 담보가 없어져도 수요원이 남아 있으면 체제는 버틴다.',
    broke:
      '셰일 혁명으로 미국의 중동 의존이 줄고, 2023년 사우디와 이란의 관계 정상화를 중국이 중재했다. 보호를 주고 결제를 받던 거래의 한쪽이 헐거워졌다.',
  },
  {
    id: 'inertia',
    era: '현재',
    title: '수요원이 특정 상품에서 관성으로 옮겨갔다',
    kind: '수요원',
    anchor: '이미 깔린 결제망·계약·준비자산',
    claimable: false,
    claimNote: '기댈 실물이 아예 없다. 남들이 쓰기 때문에 쓴다',
    narration:
      '지금 달러를 받아 두는 이유는 금도 석유도 아니다. 무역 계약이 달러로 적혀 있고, 원자재 시세가 달러로 표시되고, 외환보유고가 달러로 쌓여 있고, 결제망이 달러 은행을 거치기 때문이다. 담보도 없고 특정 상품도 없는데 수요는 오히려 더 넓어졌다. 무너지지 않는 이유가 여기 있고, 동시에 이 단계가 앞의 둘과 결정적으로 다른 점도 여기 있다. 앞의 둘은 미국이 무언가를 내줘야 유지됐지만 관성은 남들의 선택으로만 유지된다.',
    broke: '아직 깨지지 않았다. 깨뜨릴 수 있는 것은 실물 담보가 아니라 대체망, 즉 달러를 거치지 않는 결제 경로다.',
  },
];

// ─────────────────────────────────────────────────────────────
// 탭 2. 이탈의 계산
//
// 입력은 국가별 3단계 등급과 전역 슬라이더 둘이다. 실명 국가 옆에 소수점 붙은
// 추정치를 놓으면 독자가 그걸 어디서 가져온 값으로 읽고 인용하므로, 국가별 입력은
// 등급으로만 두고 숫자는 결과 비율에서만 나오게 한다.
// ─────────────────────────────────────────────────────────────

// 이탈 여력의 3단계. 값이 클수록 그 항목에서 자유롭다.
export type Grade = 'high' | 'mid' | 'low';

const GRADE_VALUE: Record<Grade, number> = { high: 1, mid: 0.55, low: 0.15 };

export type ExitCountry = {
  id: string;
  label: string;
  sub: string;
  // 달러를 거치지 않고 무역 대금을 주고받을 수 있는가
  tradeFreedom: Grade;
  // 미국의 안보 보장 없이 버틸 수 있는가
  securityIndependence: Grade;
  // 미국채·달러 자산 노출이 적은가 (적을수록 동결 위험이 작다)
  lowTreasuryExposure: Grade;
  note: string;
};

export const EXIT_COUNTRIES: ExitCountry[] = [
  {
    id: 'saudi',
    label: '사우디아라비아',
    sub: '페트로달러의 한쪽 당사자',
    tradeFreedom: 'low',
    securityIndependence: 'low',
    lowTreasuryExposure: 'low',
    note: '세 항목이 모두 막혀 있어 락인이 가장 강하다. 석유를 달러로 팔기로 한 합의가 무역 자유를 묶고, 왕정의 안전은 미군 주둔에 기대며, 오일머니는 미국채와 미국 자산에 들어가 있다. 제재 적극성을 올려도 이탈 유인이 잘 오르지 않는데, 제재 위험이 커질수록 동결될 자산도 함께 커지기 때문이다. 가진 게 많은 쪽이 더 묶인다.',
  },
  {
    id: 'russia',
    label: '러시아',
    sub: '2022년 결제망에서 배제됨',
    tradeFreedom: 'mid',
    securityIndependence: 'high',
    lowTreasuryExposure: 'high',
    note: '이미 배제당한 뒤라 잃을 것이 남아 있지 않다. 미국채 보유를 사실상 처분했고 안보를 미국에 기대지 않으며, 에너지 수출 대금을 위안화와 루블로 받는 경로를 만들었다. 제재 적극성 슬라이더를 내려 보면 이 나라의 비율이 크게 떨어진다. 제재가 없었다면 이탈할 이유도 없었다는 뜻이고, 배제가 이탈을 막은 게 아니라 만들었다는 게 이 표에서 가장 불편한 결과다.',
  },
  {
    id: 'china',
    label: '중국',
    sub: '독자 결제망 CIPS 보유',
    tradeFreedom: 'mid',
    securityIndependence: 'high',
    lowTreasuryExposure: 'low',
    note: '기준선 바로 아래에 걸려 있다. 안보는 자립했고 위안화 결제 경로도 만들었지만 미국채를 여전히 대량으로 들고 있어 동결 위험이 비용에 그대로 남는다. 대체망 성숙도를 올리면 곧바로 기준선을 넘는데, 실제로 이 나라가 결제망 구축에 들이는 노력이 그 슬라이더를 스스로 미는 일이다.',
  },
  {
    id: 'iraq',
    label: '이라크 (2000년)',
    sub: '유로 결제로 전환을 시도',
    tradeFreedom: 'low',
    securityIndependence: 'low',
    lowTreasuryExposure: 'high',
    note: '보유 자산이 적어 동결 비용은 낮았지만 무역과 안보가 모두 묶여 이탈 비율이 기준선을 한참 밑돌았다. 그런데도 2000년에 석유 대금을 유로로 받겠다고 했고 2003년에 전쟁이 있었다. 이 표가 계산하는 것은 무엇이 합리인가지 무엇이 일어나는가가 아니다. 계산이 말리는데도 움직인 사례가 남긴 것은 다른 나라들의 이탈 비용을 올린 선례였고, 그래서 이탈은 캐스케이드가 아니다.',
  },
];

// 비용 항목의 가중치. 결제 마비가 가장 즉각적이고, 자산 동결은 제재가 실제로
// 행사될 때만 실현되므로 제재 적극성이 곱해진다.
const COST_W = { payment: 1.0, security: 0.9, freeze: 0.8 };
// 비용의 하한. 어느 나라도 이탈에 마찰이 0일 수는 없고, 0으로 나누는 것도 막는다.
const COST_FLOOR = 0.15;
const BENEFIT_W = { immunity: 1.0, autonomy: 0.7 };
// 대체망이 완전히 성숙해도 결제 마비 비용이 완전히 사라지지는 않는다.
const NETWORK_RELIEF = 0.8;

export type ExitLedger = {
  paymentCost: number;
  securityCost: number;
  freezeCost: number;
  cost: number;
  immunityBenefit: number;
  autonomyBenefit: number;
  benefit: number;
  ratio: number;
  exits: boolean;
};

// 이탈 유인 비율. network·sanction은 0~1의 전역 조건이다.
//
// 제재 적극성이 분모와 분자를 동시에 미는 게 이 모델의 요점이다. 제재를 세게 쓸수록
// 동결될 자산이 늘어 이탈 비용이 오르지만, 동시에 제재를 벗어날 값어치도 커진다.
// 어느 쪽이 이기는지는 그 나라가 달러 자산을 얼마나 들고 있느냐로 갈린다.
export function exitLedger(country: ExitCountry, network: number, sanction: number): ExitLedger {
  const n = clamp(network, 0, 1);
  const s = clamp(sanction, 0, 1);

  const trade = GRADE_VALUE[country.tradeFreedom];
  const security = GRADE_VALUE[country.securityIndependence];
  const exposure = GRADE_VALUE[country.lowTreasuryExposure];

  const paymentCost = (1 - trade) * (1 - n * NETWORK_RELIEF) * COST_W.payment;
  const securityCost = (1 - security) * COST_W.security;
  const freezeCost = (1 - exposure) * s * COST_W.freeze;
  const cost = paymentCost + securityCost + freezeCost + COST_FLOOR;

  const immunityBenefit = s * BENEFIT_W.immunity;
  const autonomyBenefit = n * BENEFIT_W.autonomy;
  const benefit = immunityBenefit + autonomyBenefit;

  const ratio = benefit / cost;
  return {
    paymentCost,
    securityCost,
    freezeCost,
    cost,
    immunityBenefit,
    autonomyBenefit,
    benefit,
    ratio,
    exits: ratio >= 1,
  };
}

// ─────────────────────────────────────────────────────────────
// 탭 3. 인플레이션 수출
//
// 발행된 달러 중 국경을 넘는 몫이 통화 계층을 따라 아래로 내려간다. 같은 금액이
// 들어와도 경제 규모가 작고 방어 수단이 적을수록 물가 충격이 커진다.
// ─────────────────────────────────────────────────────────────

export type Tier = {
  id: string;
  label: string;
  currencies: string;
  // 명목 GDP 규모(조 달러) 근사. 물가 충격의 분모다.
  size: number;
  // 유입된 달러가 물가로 전가되는 정도. 환율 방어 수단과 자본 통제가 약할수록 크다.
  passthrough: number;
  // 국외 유출분을 나눠 갖는 비중
  share: number;
  className: string;
};

export const TIERS: Tier[] = [
  {
    id: 'semi',
    label: '준기축',
    currencies: '유로 · 엔 · 파운드 · 위안',
    size: 40,
    passthrough: 0.6,
    share: 0.5,
    className: 'bg-sky-500',
  },
  {
    id: 'emerging',
    label: '신흥국',
    currencies: '원 · 바트 · 링깃',
    size: 12,
    passthrough: 1.0,
    share: 0.35,
    className: 'bg-amber-500',
  },
  {
    id: 'fragile',
    label: '취약',
    currencies: '리라 · 페소',
    size: 2.5,
    passthrough: 1.6,
    share: 0.15,
    className: 'bg-rose-500',
  },
];

// 발행국(미국) 자체의 흡수 조건
const HOME_SIZE = 28;
const HOME_PASSTHROUGH = 0.35;

export type ExportRow = { tier: Tier; inflow: number; pressure: number };

export type ExportResult = {
  home: number;
  abroad: number;
  homePressure: number;
  // 한 푼도 나가지 않았다면 발행국이 받았을 압력
  closedPressure: number;
  exported: number;
  rows: ExportRow[];
};

// issuance: 발행 규모(조 달러), outflow: 국경을 넘는 비율(0~1)
export function exportLedger(issuance: number, outflow: number): ExportResult {
  const o = clamp(outflow, 0, 1);
  const abroad = issuance * o;
  const home = issuance - abroad;

  const homePressure = (home / HOME_SIZE) * HOME_PASSTHROUGH * 100;
  const closedPressure = (issuance / HOME_SIZE) * HOME_PASSTHROUGH * 100;

  const rows = TIERS.map((tier) => {
    const inflow = abroad * tier.share;
    return { tier, inflow, pressure: (inflow / tier.size) * tier.passthrough * 100 };
  });

  return { home, abroad, homePressure, closedPressure, exported: closedPressure - homePressure, rows };
}

// ─────────────────────────────────────────────────────────────
// 탭 4. 원화의 위치
//
// 미국 금리 → 한미 금리차 → 원화 절하 압력 → 한은의 선택 → 국내 대출금리.
// 대출금리로 월 상환액을 계산하는 것은 /mortgage의 몫이라 여기서는 금리까지만 간다.
// ─────────────────────────────────────────────────────────────

export const KR_RATE = {
  // 기준금리 대비 은행 대출금리 가산폭
  spread: { value: 1.6, label: '가산폭 (%p)', asOf: '2024년 평균', source: '한국은행 예금은행 가중평균 대출금리' },
  // 한은이 환율 압력을 감내하고 버티는 금리차의 폭
  tolerance: 1.5,
  // 금리차 1%p당 원화 절하 압력(%)
  depreciationPerGap: 3.0,
  // 절하가 소비자물가로 전가되는 정도
  importPassthrough: 0.33,
  // 감내 폭을 넘은 금리차를 한은이 따라가는 비율
  followRate: 0.8,
} as const;

export type KrwChain = {
  gap: number;
  depreciation: number;
  importInflation: number;
  // 한은이 원하던 금리를 지킬 수 있는가
  holds: boolean;
  forcedRate: number;
  loanRate: number;
};

// usRate·intendedRate 단위는 %.
export function krwChain(usRate: number, intendedRate: number): KrwChain {
  const gap = usRate - intendedRate;
  const excess = Math.max(0, gap - KR_RATE.tolerance);
  const forcedRate = intendedRate + excess * KR_RATE.followRate;

  // 한은이 따라 올린 만큼은 절하 압력이 줄어든다. 남은 금리차가 환율에 실린다.
  const remainingGap = Math.max(0, usRate - forcedRate);
  const depreciation = remainingGap * KR_RATE.depreciationPerGap;

  return {
    gap,
    depreciation,
    importInflation: depreciation * KR_RATE.importPassthrough,
    holds: excess === 0,
    forcedRate,
    loanRate: forcedRate + KR_RATE.spread.value,
  };
}
