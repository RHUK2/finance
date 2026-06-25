import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

import { cached } from "@/lib/cache";

export const dynamic = "force-dynamic";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const GF = "https://www.google.com/finance/quote";

const SYMBOLS = [
  {
    symbol: "BTC-USD",
    ticker: "BTC",
    label: "BTC",
    type: "crypto",
    gfUrl: `${GF}/BTC-USD`,
  },
  {
    symbol: "ETH-USD",
    ticker: "ETH",
    label: "ETH",
    type: "crypto",
    gfUrl: `${GF}/ETH-USD`,
  },
  {
    symbol: "BAT-USD",
    ticker: "BAT",
    label: "BAT",
    type: "crypto",
    gfUrl: `${GF}/BAT-USD`,
  },
  {
    symbol: "BAT-BTC",
    ticker: "BAT/BTC",
    label: "BAT/BTC",
    type: "crypto",
    gfUrl: `${GF}/BAT-BTC`,
  },
  {
    symbol: "MSTR",
    ticker: "MSTR",
    label: "마이크로스트래티지",
    type: "stock",
    gfUrl: `${GF}/MSTR:NASDAQ`,
  },
  {
    symbol: "STRC",
    ticker: "STRC",
    label: "스트래티지",
    type: "stock",
    gfUrl: `${GF}/STRC:NASDAQ`,
  },
  {
    symbol: "TSLA",
    ticker: "TSLA",
    label: "테슬라",
    type: "stock",
    gfUrl: `${GF}/TSLA:NASDAQ`,
  },
  {
    symbol: "SPCX",
    ticker: "SPCX",
    label: "스페이스X",
    type: "stock",
    gfUrl: `${GF}/SPCX:NASDAQ`,
  },
  {
    symbol: "NVDA",
    ticker: "NVDA",
    label: "엔비디아",
    type: "stock",
    gfUrl: `${GF}/NVDA:NASDAQ`,
  },
  {
    symbol: "005930.KS",
    ticker: "005930",
    label: "삼성전자",
    type: "stock",
    gfUrl: `${GF}/005930:KRX`,
  },
  {
    symbol: "000660.KS",
    ticker: "000660",
    label: "SK하이닉스",
    type: "stock",
    gfUrl: `${GF}/000660:KRX`,
  },
  {
    symbol: "TSM",
    ticker: "TSM",
    label: "TSMC",
    type: "stock",
    gfUrl: `${GF}/TSM:NYSE`,
  },
  {
    symbol: "GOOGL",
    ticker: "GOOGL",
    label: "구글",
    type: "stock",
    gfUrl: `${GF}/GOOGL:NASDAQ`,
  },
  {
    symbol: "MSFT",
    ticker: "MSFT",
    label: "마이크로소프트",
    type: "stock",
    gfUrl: `${GF}/MSFT:NASDAQ`,
  },
  {
    symbol: "AAPL",
    ticker: "AAPL",
    label: "애플",
    type: "stock",
    gfUrl: `${GF}/AAPL:NASDAQ`,
  },
  {
    symbol: "META",
    ticker: "META",
    label: "메타",
    type: "stock",
    gfUrl: `${GF}/META:NASDAQ`,
  },
  {
    symbol: "AMZN",
    ticker: "AMZN",
    label: "아마존",
    type: "stock",
    gfUrl: `${GF}/AMZN:NASDAQ`,
  },
];

export async function GET() {
  try {
    const data = await cached("market", async () => {
      const quotes = (await yf.quote(
        SYMBOLS.map((s) => s.symbol),
        { return: "object" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      )) as Record<string, any>;

      const results = SYMBOLS.map(({ symbol, ticker, label, type, gfUrl }) => {
        const quote = quotes[symbol] ?? {};
        return {
          symbol,
          ticker,
          label,
          type,
          gfUrl,
          price: quote.regularMarketPrice ?? null,
          change: quote.regularMarketChange ?? null,
          changePercent: quote.regularMarketChangePercent ?? null,
          currency: quote.currency ?? "USD",
        };
      });

      return { fetchedAt: new Date().toISOString(), items: results };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("market fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch market data" },
      { status: 500 },
    );
  }
}
