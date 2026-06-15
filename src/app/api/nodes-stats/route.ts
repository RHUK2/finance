import { NextResponse } from "next/server";

export const revalidate = 86400;

export async function GET() {
  try {
    const res = await fetch("https://bitnodes.io/api/v1/snapshots/?limit=1", {
      next: { revalidate: 86400 },
    });

    if (!res.ok) throw new Error(`bitnodes error: ${res.status}`);

    const data = await res.json();
    const snapshot = data.results?.[0];

    if (!snapshot) throw new Error("No bitnodes snapshot data");

    return NextResponse.json({
      fullNodeCount: snapshot.total_nodes as number,
    });
  } catch (error) {
    console.error("nodes-stats fetch error:", error);
    return NextResponse.json({ fullNodeCount: null });
  }
}
