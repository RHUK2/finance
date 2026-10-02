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
 * 시작) null. 예: BTC를 2010년 시작연도로 조회하면 null(2015년부터 존재).
 */
export function valueAt(history: Point[] | undefined, year: number): number | null {
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
export function grow(principal: number, start: number | null, now: number | null): number | null {
  if (start == null || now == null || start === 0) return null;
  return principal * (now / start);
}

/**
 * 예금 누적의 단일 출처. 시작연도 1월부터 관측월마다 그 달 초의 누적 배수를 찍고, 그 달
 * 이자(연 환산 금리 ÷ 12)를 곱해 다음 달로 넘긴다. `final`은 마지막 관측월 이자까지 넣은
 * 배수(마지막 관측 다음 달 초)다. 시작연도가 금리 데이터 범위 밖이면 null.
 *
 * 카드(`compoundDeposit`)는 월별 금리가 한 달 늦게 나오므로 마지막 관측월 이자까지 넣은
 * `final`을 "오늘"로 쓰고, 차트(`depositIndex`)는 각 점의 x축 날짜(관측월 초) 잔고를 그린다.
 * 두 값의 차이는 마지막 한 달 이자다. 경계를 바꾸려면 여기 한 곳만 고친다.
 */
function depositFactors(rateHistory: Point[] | undefined, year: number) {
  if (!rateHistory || rateHistory.length === 0) return null;
  if (rateHistory[0].time > `${year}-12-31`) return null;
  const target = `${year}-01-01`;
  const monthStart: { time: string; factor: number }[] = [];
  let factor = 1;
  for (const p of rateHistory) {
    if (p.time < target) continue;
    monthStart.push({ time: p.time, factor });
    factor *= 1 + p.value / 100 / 12;
  }
  return { monthStart, final: factor };
}

/** 예금 누적: 연 환산 금리(%) 월별 시계열을 월복리로 누적. 범위 밖이면 null. */
export function compoundDeposit(principal: number, rateHistory: Point[] | undefined, year: number): number | null {
  const f = depositFactors(rateHistory, year);
  return f ? principal * f.final : null;
}

/**
 * USD 일별 시계열을 월별 환율로 원화 환산. 각 일자에는 그 달의 환율을 적용하며,
 * 환율이 아직 없는 최근 달은 직전 환율을 이어쓴다(carry-forward). 두 시계열 모두
 * 시간 오름차순이라고 가정하고 2-포인터로 O(n+m) 처리.
 */
export function toKrw(usd: Point[] | undefined, fx: Point[] | undefined): Point[] | undefined {
  if (!usd || !fx || fx.length === 0) return undefined;
  let i = 0;
  return usd.map((p) => {
    const month = p.time.slice(0, 7);
    while (i + 1 < fx.length && fx[i + 1].time.slice(0, 7) <= month) i++;
    return { time: p.time, value: p.value * fx[i].value };
  });
}

/** 시작연도=base로 정규화한 곡선(격차 차트용). */
export function normalizeToBase(history: Point[] | undefined, baseYear: number, base = 100): Point[] {
  const baseVal = valueAt(history, baseYear);
  if (!history || baseVal == null || baseVal === 0) return [];
  return history
    .filter((p) => p.time >= `${baseYear}-01-01`)
    .map((p) => ({ time: p.time, value: (p.value / baseVal) * base }));
}

/** 예금 누적 지수 곡선(레이스 차트용). baseYear에서 base로 출발해 월복리. */
export function depositIndex(rateHistory: Point[] | undefined, baseYear: number, base = 100): Point[] {
  const f = depositFactors(rateHistory, baseYear);
  return f ? f.monthStart.map((m) => ({ time: m.time, value: base * m.factor })) : [];
}

/** 최저임금 테이블에서 해당 연도(이하 최댓값) 시급을 반환. */
export function minWageAt(table: { year: number; wage: number }[], year: number): number | null {
  let found: number | null = null;
  for (const row of table) {
    if (row.year <= year) found = row.wage;
    else break;
  }
  return found;
}

// 두 표는 룩업 의미가 다르다. 미국 연방 최저임금은 2009년 이후 실제로 그대로라
// 표에 없는 연도는 "안 바뀐 것"이고 이하 최댓값 룩업이 옳다. 한국은 매년 바뀌므로
// 표에 없는 연도는 "아직 표에 안 넣은 것"이라 그대로 조회하면 낡은 값을 오늘 값으로
// 쓰게 된다. 그래서 한국은 표가 커버하는 마지막 해(아래 KR_WAGE_LAST_YEAR)까지만 조회한다.
// 조회 상한은 낡은 값을 막지 못하고 마지막 해 값을 돌려줄 뿐이라, 화면이 그 연도를 함께 적는다.

/**
 * 미국 연방 최저임금 ($/시간). 1968년 이후 인상 시점을 빠짐없이 기록한다. 이하 최댓값
 * 룩업이라 하나라도 빠지면 그 해 값이 틀린다. `year`는 인상이 시행된 해다(1990-04 등 연중 시행 포함).
 */
export const US_MIN_WAGE: { year: number; wage: number }[] = [
  { year: 1968, wage: 1.6 },
  { year: 1974, wage: 2.0 },
  { year: 1975, wage: 2.1 },
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

/**
 * 한국 최저임금 (원/시간), 적용연도 기준. 2006년 이전은 적용기간이 전년 9월~당해 8월이라
 * 그 기간이 끝나는 해를 `year`로 둔다(2000 → '99.9~'00.8, 2006 → '05.9~'06.12).
 */
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
  { year: 2026, wage: 10320 },
  { year: 2027, wage: 10700 }, // 고용노동부 고시 제2026-60호(2026-08-05)
];

/** 한국 최저임금 표가 커버하는 마지막 연도. 표를 갱신하면 자동으로 따라간다. */
export const KR_WAGE_LAST_YEAR = KR_MIN_WAGE[KR_MIN_WAGE.length - 1].year;
