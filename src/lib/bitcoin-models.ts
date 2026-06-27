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

// 반감기별 블록 보상 (일일 발행량 계산용)
const HALVINGS = [
  { date: "2009-01-03", reward: 50 },
  { date: "2012-11-28", reward: 25 },
  { date: "2016-07-09", reward: 12.5 },
  { date: "2020-05-11", reward: 6.25 },
  { date: "2024-04-19", reward: 3.125 },
  { date: "2028-04-20", reward: 1.5625 },
] as const;

function getEra(dateStr: string): (typeof HALVINGS)[number] {
  const dateMs = new Date(dateStr).getTime();
  let era: (typeof HALVINGS)[number] = HALVINGS[0];
  for (const h of HALVINGS) {
    if (dateMs >= new Date(h.date).getTime()) era = h;
    else break;
  }
  return era;
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

// N일 롤링 실현변동성(연율화 %). 일간 로그수익률의 window 구간 표준편차 × √365 × 100.
// 정렬된 입력 기준이며, window 미만 구간은 제외하고 반환
export function rollingVolatility(
  series: SeriesPoint[],
  window: number,
): SeriesPoint[] {
  if (window <= 0 || series.length < 2) return [];
  const returns: SeriesPoint[] = [];
  for (let i = 1; i < series.length; i++) {
    const prev = series[i - 1].value;
    if (prev > 0)
      returns.push({ time: series[i].time, value: Math.log(series[i].value / prev) });
  }
  const out: SeriesPoint[] = [];
  for (let i = window - 1; i < returns.length; i++) {
    let mean = 0;
    for (let j = i - window + 1; j <= i; j++) mean += returns[j].value;
    mean /= window;
    let variance = 0;
    for (let j = i - window + 1; j <= i; j++) {
      const d = returns[j].value - mean;
      variance += d * d;
    }
    variance /= window;
    out.push({
      time: returns[i].time,
      value: Math.sqrt(variance) * Math.sqrt(365) * 100,
    });
  }
  return out;
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
