// 주택담보대출 상환 계산. 외부 API 없이 순수 계산만 한다.
// 금액 단위는 만원, 금리는 연 %로 받는다.

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
