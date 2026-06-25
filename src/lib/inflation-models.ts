/**
 * 구매력/인플레이션 계산 모델. 외부 API 없이 순수 계산만 담당.
 *
 * 모든 환산은 "시작연도 1개 값 + 현재 1개 값"의 2점 비율만 사용하므로
 * 서로 다른 빈도(월별 CPI/M2 vs 일별 금·주식·BTC)를 정렬·보간할 필요가 없다.
 * 차트용 곡선만 시작연도=base로 정규화한다.
 */

export type Point = { time: string; value: number };

/**
 * 해당 연도 시점의 관측값. 시계열이 그 연도를 포함하지 않으면(데이터가 그 이후
 * 시작) null — 예: BTC를 2010년 시작연도로 조회하면 null(2015년부터 존재).
 */
export function valueAt(
  history: Point[] | undefined,
  year: number,
): number | null {
  if (!history || history.length === 0) return null;
  if (history[0].time > `${year}-12-31`) return null;
  const target = `${year}-01-01`;
  for (const p of history) {
    if (p.time >= target) return p.value;
  }
  return history[history.length - 1].value;
}

export function latestValue(history: Point[] | undefined): number | null {
  if (!history || history.length === 0) return null;
  return history[history.length - 1].value;
}

/** 비율 환산: principal × (now / start). 자산·CPI·M2 평가에 공통 사용. */
export function grow(
  principal: number,
  start: number | null,
  now: number | null,
): number | null {
  if (start == null || now == null || start === 0) return null;
  return principal * (now / start);
}

/**
 * 예금 누적: 연 환산 금리(%) 월별 시계열을 월복리로 누적.
 * 시작연도가 금리 데이터 범위 밖이면 null.
 */
export function compoundDeposit(
  principal: number,
  rateHistory: Point[] | undefined,
  year: number,
): number | null {
  if (!rateHistory || rateHistory.length === 0) return null;
  if (rateHistory[0].time > `${year}-12-31`) return null;
  const target = `${year}-01-01`;
  let factor = 1;
  for (const p of rateHistory) {
    if (p.time < target) continue;
    factor *= 1 + p.value / 100 / 12;
  }
  return principal * factor;
}

/**
 * 적립식(적금) 만기 평가액: 매월 monthly를 납입해 금리로 월복리.
 * 납입이 일어난 월 목록("YYYY-MM")도 함께 반환(자산 DCA와 월을 맞추기 위함).
 */
export function recurringDepositFV(
  monthly: number,
  rateHistory: Point[] | undefined,
  year: number,
): { fv: number; months: string[] } | null {
  if (!rateHistory || rateHistory.length === 0) return null;
  if (rateHistory[0].time > `${year}-12-31`) return null;
  let bal = 0;
  const months: string[] = [];
  for (const p of rateHistory) {
    if (p.time < `${year}-01-01`) continue;
    bal = bal * (1 + p.value / 100 / 12) + monthly;
    months.push(p.time.slice(0, 7));
  }
  return months.length ? { fv: bal, months } : null;
}

/**
 * 적립식 DCA 평가액: 주어진 납입 월마다 monthly만큼 매수했을 때 현재 평가액.
 * 시계열이 첫 납입 월보다 늦게 시작하면(범위 밖) null. 중간 결측 월은 직전값으로 보간.
 */
export function recurringDCA(
  monthly: number,
  series: Point[] | undefined,
  months: string[],
): number | null {
  if (!series || series.length === 0 || months.length === 0) return null;
  if (series[0].time.slice(0, 7) > months[0]) return null;
  const byMonth = new Map<string, number>();
  for (const p of series) {
    const k = p.time.slice(0, 7);
    if (!byMonth.has(k)) byMonth.set(k, p.value);
  }
  const now = series[series.length - 1].value;
  let total = 0;
  let last: number | null = null;
  for (const m of months) {
    const v: number | null = byMonth.get(m) ?? last;
    if (v == null || v === 0) continue;
    last = v;
    total += monthly * (now / v);
  }
  return total;
}

/** 시작연도=base로 정규화한 곡선(격차 차트용). */
export function normalizeToBase(
  history: Point[] | undefined,
  baseYear: number,
  base = 100,
): Point[] {
  const baseVal = valueAt(history, baseYear);
  if (!history || baseVal == null || baseVal === 0) return [];
  return history
    .filter((p) => p.time >= `${baseYear}-01-01`)
    .map((p) => ({ time: p.time, value: (p.value / baseVal) * base }));
}

/** 예금 누적 지수 곡선(레이스 차트용). baseYear에서 base로 출발해 월복리. */
export function depositIndex(
  rateHistory: Point[] | undefined,
  baseYear: number,
  base = 100,
): Point[] {
  if (!rateHistory || rateHistory.length === 0) return [];
  if (rateHistory[0].time > `${baseYear}-12-31`) return [];
  const target = `${baseYear}-01-01`;
  const out: Point[] = [];
  let factor = 1;
  for (const p of rateHistory) {
    if (p.time < target) continue;
    out.push({ time: p.time, value: base * factor });
    factor *= 1 + p.value / 100 / 12;
  }
  return out;
}

/** 최저임금 테이블에서 해당 연도(이하 최댓값) 시급을 반환. */
export function minWageAt(
  table: { year: number; wage: number }[],
  year: number,
): number | null {
  let found: number | null = null;
  for (const row of table) {
    if (row.year <= year) found = row.wage;
    else break;
  }
  return found;
}

/** 미국 연방 최저임금 ($/시간). 주요 인상 시점만 기록(이하 최댓값 룩업). */
export const US_MIN_WAGE: { year: number; wage: number }[] = [
  { year: 1968, wage: 1.6 },
  { year: 1974, wage: 2.0 },
  { year: 1976, wage: 2.3 },
  { year: 1978, wage: 2.65 },
  { year: 1979, wage: 2.9 },
  { year: 1980, wage: 3.1 },
  { year: 1981, wage: 3.35 },
  { year: 1990, wage: 3.8 },
  { year: 1991, wage: 4.25 },
  { year: 1996, wage: 4.75 },
  { year: 1997, wage: 5.15 },
  { year: 2007, wage: 5.85 },
  { year: 2008, wage: 6.55 },
  { year: 2009, wage: 7.25 },
];

/** 한국 최저임금 (원/시간), 적용연도 기준. */
export const KR_MIN_WAGE: { year: number; wage: number }[] = [
  { year: 2000, wage: 1600 },
  { year: 2001, wage: 1865 },
  { year: 2002, wage: 2100 },
  { year: 2003, wage: 2275 },
  { year: 2004, wage: 2510 },
  { year: 2005, wage: 2840 },
  { year: 2006, wage: 3100 },
  { year: 2007, wage: 3480 },
  { year: 2008, wage: 3770 },
  { year: 2009, wage: 4000 },
  { year: 2010, wage: 4110 },
  { year: 2011, wage: 4320 },
  { year: 2012, wage: 4580 },
  { year: 2013, wage: 4860 },
  { year: 2014, wage: 5210 },
  { year: 2015, wage: 5580 },
  { year: 2016, wage: 6030 },
  { year: 2017, wage: 6470 },
  { year: 2018, wage: 7530 },
  { year: 2019, wage: 8350 },
  { year: 2020, wage: 8590 },
  { year: 2021, wage: 8720 },
  { year: 2022, wage: 9160 },
  { year: 2023, wage: 9620 },
  { year: 2024, wage: 9860 },
  { year: 2025, wage: 10030 },
];
