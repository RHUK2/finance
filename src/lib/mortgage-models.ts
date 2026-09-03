// 주택담보대출 상환 계산과 관련 규제·세율. 외부 API 없이 순수 계산만 한다.
// 금액 단위는 만원, 금리는 연 %로 받는다.

// 규제·세율 수치는 대책 한 번에 바뀐다. 값과 기준을 여기 한곳에 모아 두고, 화면에는
// 값과 함께 반드시 `note`를 적는다. 날짜 없는 규제 수치는 조용히 틀린 문서가 된다.
export const REGULATION = {
  // 차주단위 DSR 한도. 은행권 기준이고 제2금융권은 50%다.
  dsrCap: 40,
  dsrNote: '은행권 기준, 2026년 8월 현재',
  // 스트레스 DSR 3단계는 2025.7부터 하한 1.5%p였으나, 10·15 대책으로 2025.10.16부터
  // 수도권·규제지역 주택담보대출은 3.0%p로 올랐다. 비수도권은 더 낮다.
  stressAdd: 3.0,
  stressNote: '수도권·규제지역, 2025.10.16 시행',
} as const;

// 주택 유상거래 취득세율(%). 지방세법 11조 1항 8호의 1주택 기준이다.
// 6억 이하 1%, 6억 초과 9억 이하는 (가액[억] × 2/3 − 3), 9억 초과 3%.
// 여기에 지방교육세가 취득세율의 10%만큼 붙는다(취득세율 × 1/2 × 20%).
// 다주택·조정대상지역 중과세율과 전용 85제곱미터 초과에 붙는 농특세 0.2%는 넣지 않았다.
export const ACQUISITION_TAX_NOTE = '1주택 기준, 지방교육세 포함';

export function acquisitionTaxRate(priceMan: number) {
  const eok = priceMan / 10000;
  const base = eok <= 6 ? 1 : eok <= 9 ? (eok * 2) / 3 - 3 : 3;
  return base * 1.1;
}

// 연 보유세율(%). 재산세·종부세를 시가 대비 한 비율로 뭉갠 근사라 법정 세율이 아니다.
// 실제 보유세는 공시가격에 공정시장가액비율을 곱한 과세표준에 누진세율을 매기고,
// 1주택 여부와 공시가격 구간에 따라 크게 갈린다. 매수·임차 비교에서 자릿수를 맞추려고
// 하나의 비율로 눌러 둔 값이라, 화면에 쓸 때 반드시 note를 함께 적는다.
export const HOLDING_TAX_RATE = 0.15;
export const HOLDING_TAX_NOTE = '재산세·종부세를 시가 대비로 뭉갠 근사, 법정 세율 아님';

export type RepayMethod = 'equal-payment' | 'equal-principal' | 'bullet';

export const REPAY_LABEL: Record<RepayMethod, string> = {
  'equal-payment': '원리금균등',
  'equal-principal': '원금균등',
  bullet: '만기일시',
};

// 화면에 늘어놓는 순서. 무엇이 상환 방식인지는 이 파일이 단일 출처다.
export const REPAY_METHODS: RepayMethod[] = ['equal-payment', 'equal-principal', 'bullet'];

// 원리금균등 상환의 월 납입액. 금리가 0이면 원금을 회차로 나눈다.
export function levelPayment(principal: number, annualRate: number, years: number) {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - (1 + r) ** -n);
}

export type MonthRow = { interest: number; principal: number; balance: number };

// 회차별 이자·원금·잔액. 만기일시는 매달 이자만 내고 마지막에 원금을 한 번에 갚는다.
export function schedule(principal: number, annualRate: number, years: number, method: RepayMethod): MonthRow[] {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  const level = levelPayment(principal, annualRate, years);
  const rows: MonthRow[] = [];
  let balance = principal;

  for (let i = 0; i < n; i++) {
    const interest = balance * r;
    const paid =
      method === 'equal-payment'
        ? Math.min(level - interest, balance)
        : method === 'equal-principal'
          ? principal / n
          : i === n - 1
            ? balance
            : 0;
    balance -= paid;
    rows.push({ interest, principal: paid, balance: Math.max(0, balance) });
  }
  return rows;
}

// 월 단위 회차를 연 단위로 묶는다. 그래프에 쓰는 형태.
export function byYear(rows: MonthRow[]) {
  const years: MonthRow[] = [];
  for (let y = 0; y * 12 < rows.length; y++) {
    const chunk = rows.slice(y * 12, y * 12 + 12);
    years.push({
      interest: chunk.reduce((s, m) => s + m.interest, 0),
      principal: chunk.reduce((s, m) => s + m.principal, 0),
      balance: chunk[chunk.length - 1].balance,
    });
  }
  return years;
}

// DSR 한도가 허용하는 최대 대출액. 원리금균등 기준으로 역산한다.
export function maxLoanByDsr(annualIncome: number, dsrCap: number, annualRate: number, years: number) {
  const perUnit = levelPayment(1, annualRate, years) * 12;
  return (annualIncome * dsrCap) / 100 / perUnit;
}
