import { NextResponse } from "next/server";

export const revalidate = 86400;

export async function GET() {
  try {
    const res = await fetch(
      "https://mempool.space/api/v1/lightning/statistics/latest",
      { next: { revalidate: 86400 } },
    );

    if (!res.ok) throw new Error(`lightning stats error: ${res.status}`);

    const data = await res.json();
    const latest = data.latest;
    if (!latest) throw new Error("No lightning stats data");

    return NextResponse.json({
      nodeCount: latest.node_count as number,
      channelCount: latest.channel_count as number,
      totalCapacityBTC: Number(
        ((latest.total_capacity as number) / 1e8).toFixed(2),
      ),
    });
  } catch (error) {
    console.error("lightning-stats fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch lightning stats" },
      { status: 500 },
    );
  }
}
