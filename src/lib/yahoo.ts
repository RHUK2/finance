import YahooFinance from "yahoo-finance2";

import { toMacroSeries, type MacroSeries } from "./series";

export const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

/** 심볼 목록의 최근 2년 일봉 종가를 받아 key → MacroSeries 매핑으로 반환. */
export async function fetchYahooSeries(
  symbols: readonly { key: string; symbol: string }[],
): Promise<Record<string, MacroSeries>> {
  const period1 = new Date(Date.now() - 2 * 365 * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const entries = await Promise.all(
    symbols.map(async ({ key, symbol }) => {
      const res = await yf.chart(symbol, { period1, interval: "1d" });
      const history = res.quotes
        .filter((q) => q.close != null)
        .map((q) => ({
          time: q.date.toISOString().slice(0, 10),
          value: Number((q.close as number).toFixed(2)),
        }));
      return [key, toMacroSeries(history)] as const;
    }),
  );

  return Object.fromEntries(entries);
}
