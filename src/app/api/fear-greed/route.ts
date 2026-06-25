import { NextResponse } from "next/server";

import { cached } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await cached("fear-greed", async () => {
      const res = await fetch("https://api.alternative.me/fng/?limit=2000", {
        cache: "no-store",
      });

      if (!res.ok) throw new Error(`Alternative.me error: ${res.status}`);

      const json = await res.json();
      const rows: {
        value: string;
        value_classification: string;
        timestamp: string;
      }[] = json.data ?? [];

      if (rows.length === 0) throw new Error("No fear & greed data");

      const history = rows
        .map((row) => ({
          time: new Date(Number(row.timestamp) * 1000)
            .toISOString()
            .slice(0, 10),
          value: Number(row.value),
        }))
        .reverse();

      const latest = history[history.length - 1];
      const latestRow = rows[0];

      return {
        fetchedAt: new Date().toISOString(),
        value: latest.value,
        classification: latestRow.value_classification,
        timestamp: latestRow.timestamp,
        history,
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("fear-greed fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch fear & greed data" },
      { status: 500 },
    );
  }
}
