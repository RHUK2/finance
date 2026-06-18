const GENESIS_MS = new Date("2009-01-03").getTime();
const MS_PER_DAY = 86_400_000;

export function daysSinceGenesis(dateStr: string): number {
  return Math.max(
    1,
    Math.floor((new Date(dateStr).getTime() - GENESIS_MS) / MS_PER_DAY),
  );
}

// Power Law: log10(price) = A * log10(days) + B
// Calibrated to BTC cycle lows: Nov 2012 (~$13), Jul 2015 (~$280), Dec 2018 (~$3,200)
const PL_A = 5.97;
const PL_B = -17.72;

export function powerLawPrice(days: number): number {
  if (days < 1) return 0;
  return Math.pow(10, PL_A * Math.log10(days) + PL_B);
}

// 9 bands equally spaced in log scale from 0.1x to 20x of power law
export const RAINBOW_BANDS = [
  { upper: 0.18, color: "#312e81", label: "불장 대청소" },
  { upper: 0.325, color: "#1d4ed8", label: "매수!" },
  { upper: 0.586, color: "#0891b2", label: "축적" },
  { upper: 1.057, color: "#16a34a", label: "아직 저렴" },
  { upper: 1.905, color: "#84cc16", label: "HODL!" },
  { upper: 3.434, color: "#ca8a04", label: "버블인가?" },
  { upper: 6.194, color: "#ea580c", label: "FOMO 과열" },
  { upper: 11.17, color: "#dc2626", label: "매도 고려" },
  { upper: 20.13, color: "#7f1d1d", label: "최대 버블" },
] as const;

// S2F Halvings with precise cumulative supply at each era start
const HALVINGS = [
  { date: "2009-01-03", supplyAtStart: 0, reward: 50 },
  { date: "2012-11-28", supplyAtStart: 10_500_000, reward: 25 },
  { date: "2016-07-09", supplyAtStart: 15_750_000, reward: 12.5 },
  { date: "2020-05-11", supplyAtStart: 18_375_000, reward: 6.25 },
  { date: "2024-04-19", supplyAtStart: 19_687_500, reward: 3.125 },
  { date: "2028-04-20", supplyAtStart: 20_343_750, reward: 1.5625 },
] as const;

export const HALVING_DATES = HALVINGS.slice(1).map((h) => h.date);

function getEra(dateStr: string): (typeof HALVINGS)[number] {
  const dateMs = new Date(dateStr).getTime();
  let era: (typeof HALVINGS)[number] = HALVINGS[0];
  for (const h of HALVINGS) {
    if (dateMs >= new Date(h.date).getTime()) era = h;
    else break;
  }
  return era;
}

function circulatingSupply(dateStr: string): number {
  const era = getEra(dateStr);
  const dateMs = new Date(dateStr).getTime();
  const eraStartMs = new Date(era.date).getTime();
  const daysSinceEra = (dateMs - eraStartMs) / MS_PER_DAY;
  return Math.min(
    era.supplyAtStart + daysSinceEra * 144 * era.reward,
    21_000_000,
  );
}

// 일일 신규 발행량 (BTC). 블록당 보상 × 하루 평균 블록 수(144)
export function dailyIssuanceBtc(dateStr: string): number {
  return getEra(dateStr).reward * 144;
}

export type SeriesPoint = { time: string; value: number };

// N일 단순 이동평균. window 미만 구간은 제외하고 정렬된 입력 기준으로 반환
export function movingAverage(
  series: SeriesPoint[],
  window: number,
): SeriesPoint[] {
  if (window <= 0) return [];
  const out: SeriesPoint[] = [];
  let sum = 0;
  for (let i = 0; i < series.length; i++) {
    sum += series[i].value;
    if (i >= window) sum -= series[i - window].value;
    if (i >= window - 1)
      out.push({ time: series[i].time, value: sum / window });
  }
  return out;
}

export function s2fRatio(dateStr: string): number {
  const era = getEra(dateStr);
  const supply = circulatingSupply(dateStr);
  const annualFlow = era.reward * 144 * 365;
  return supply / annualFlow;
}

// PlanB original 2019 S2F model: market_cap = exp(14.6) * S2F^3.3
export function s2fModelPrice(dateStr: string): number {
  const s2f = s2fRatio(dateStr);
  if (s2f <= 0) return 0;
  const marketCap = Math.exp(14.6) * Math.pow(s2f, 3.3);
  const supply = circulatingSupply(dateStr);
  return marketCap / supply;
}

export function generateModelDates(
  startDate: string,
  endDate: string,
  stepDays = 7,
): string[] {
  const dates: string[] = [];
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  for (let t = start; t <= end; t += stepDays * MS_PER_DAY) {
    dates.push(new Date(t).toISOString().slice(0, 10));
  }
  return dates;
}
