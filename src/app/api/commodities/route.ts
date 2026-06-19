import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const revalidate = 3600;

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const SYMBOLS = [
  { key: "gold", symbol: "GC=F" },
  { key: "wti", symbol: "CL=F" },
  { key: "brent", symbol: "BZ=F" },
  { key: "corn", symbol: "ZC=F" },
] as const;

type Series = {
  history: { time: string; value: number }[];
  current: number | null;
  changePercent: number | null;
};

export async function GET() {
  try {
    const period1 = new Date(Date.now() - 2 * 365 * 86_400_000)
      .toISOString()
      .slice(0, 10);

    const entries = await Promise.all(
      SYMBOLS.map(async ({ key, symbol }) => {
        const res = await yf.chart(symbol, { period1, interval: "1d" });
        const history = res.quotes
          .filter((q) => q.close != null)
          .map((q) => ({
            time: q.date.toISOString().slice(0, 10),
            value: Number((q.close as number).toFixed(2)),
          }));
        const last = history[history.length - 1];
        const prev = history[history.length - 2];
        const changePercent =
          last && prev && prev.value !== 0
            ? Number(
                (((last.value - prev.value) / prev.value) * 100).toFixed(2),
              )
            : null;
        return [
          key,
          { history, current: last?.value ?? null, changePercent } as Series,
        ] as const;
      }),
    );

    return NextResponse.json({
      fetchedAt: new Date().toISOString(),
      ...Object.fromEntries(entries),
    });
  } catch (error) {
    console.error("commodities fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch commodities data" },
      { status: 500 },
    );
  }
}
