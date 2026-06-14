import { NextResponse } from "next/server";

export const revalidate = 86400;

// Binance BTCUSDT 상장일: 2017-08-17
const BINANCE_START_MS = 1502928000000;

export async function GET() {
  try {
    const history: { time: string; value: number }[] = [];
    let startTime = BINANCE_START_MS;

    while (true) {
      const url = `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&startTime=${startTime}&limit=1000`;
      const res = await fetch(url, { next: { revalidate: 86400 } });

      if (!res.ok) throw new Error(`Binance error: ${res.status}`);

      // [openTime, open, high, low, close, volume, closeTime, ...]
      const candles: [number, string, string, string, string, ...unknown[]][] =
        await res.json();
      if (!candles.length) break;

      for (const candle of candles) {
        const time = new Date(candle[0]).toISOString().slice(0, 10);
        const close = parseFloat(candle[4]);
        history.push({ time, value: close });
      }

      if (candles.length < 1000) break;
      startTime = candles[candles.length - 1][0] + 86_400_000;
    }

    return NextResponse.json({ history });
  } catch (error) {
    console.error("bitcoin historical fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 },
    );
  }
}
