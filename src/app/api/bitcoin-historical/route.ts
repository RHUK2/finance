import { NextResponse } from "next/server";

import { cached } from "@/lib/cache";

export const dynamic = "force-dynamic";

// Coinbase BTC-USD 상장일: 2015-07-20
const COINBASE_START_MS = 1437436800000;
const CHUNK_DAYS = 300;
const DAY_MS = 86_400_000;

export async function GET() {
  try {
    const data = await cached("bitcoin-historical", async () => {
      // 청크 범위는 미리 다 알 수 있으므로 병렬로 요청 (Coinbase 공개 rate limit을 고려해 배치 단위)
      const ranges: { startMs: number; endMs: number }[] = [];
      const nowMs = Date.now();
      for (let startMs = COINBASE_START_MS; startMs < nowMs; ) {
        const endMs = Math.min(startMs + CHUNK_DAYS * DAY_MS, nowMs);
        ranges.push({ startMs, endMs });
        startMs = endMs + DAY_MS;
      }

      const history: { time: string; value: number }[] = [];
      const BATCH = 8;
      for (let i = 0; i < ranges.length; i += BATCH) {
        const chunks = await Promise.all(
          ranges.slice(i, i + BATCH).map(async ({ startMs, endMs }) => {
            const start = new Date(startMs).toISOString();
            const end = new Date(endMs).toISOString();
            const url = `https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=86400&start=${start}&end=${end}`;

            const res = await fetch(url, { cache: "no-store" });
            if (!res.ok) throw new Error(`Coinbase error: ${res.status}`);

            // [timestamp_sec, low, high, open, close, volume], 내림차순 반환
            const candles: [number, number, number, number, number, number][] =
              await res.json();

            return candles.map(([tSec, , , , close]) => ({
              time: new Date(tSec * 1000).toISOString().slice(0, 10),
              value: close,
            }));
          }),
        );
        for (const chunk of chunks) history.push(...chunk);
      }

      // Coinbase는 내림차순이므로 날짜 오름차순으로 정렬
      history.sort((a, b) => a.time.localeCompare(b.time));

      return { fetchedAt: new Date().toISOString(), history };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("bitcoin historical fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 },
    );
  }
}
