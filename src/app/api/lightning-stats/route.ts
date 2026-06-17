import { pctChange } from "@/lib/utils";
import { NextResponse } from "next/server";

export const revalidate = 3600;

type LightningEntry = {
  added: number;
  channel_count: number;
  total_capacity: number;
  tor_nodes: number;
  clearnet_nodes: number;
  clearnet_tor_nodes: number;
  unannounced_nodes: number;
};

function nodeCount(e: LightningEntry) {
  return (
    e.tor_nodes + e.clearnet_nodes + e.clearnet_tor_nodes + e.unannounced_nodes
  );
}

export async function GET() {
  try {
    const res = await fetch(
      "https://mempool.space/api/v1/lightning/statistics/1w",
      { next: { revalidate: 3600 } },
    );

    if (!res.ok) throw new Error(`lightning stats error: ${res.status}`);

    const entries = (await res.json()) as LightningEntry[];
    if (!entries.length) throw new Error("No lightning stats data");

    const latest = entries[0];
    const oldest = entries[entries.length - 1];

    const latestNodes = nodeCount(latest);
    const oldestNodes = nodeCount(oldest);

    return NextResponse.json({
      fetchedAt: new Date().toISOString(),
      nodeCount: latestNodes,
      channelCount: latest.channel_count,
      totalCapacityBTC: Number((latest.total_capacity / 1e8).toFixed(2)),
      nodeCountChangePct: pctChange(latestNodes, oldestNodes),
      channelCountChangePct: pctChange(
        latest.channel_count,
        oldest.channel_count,
      ),
      capacityChangePct: pctChange(
        latest.total_capacity,
        oldest.total_capacity,
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
