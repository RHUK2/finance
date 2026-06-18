import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

const POOL_COLORS = [
  "#f7931a",
  "#3b82f6",
  "#22c55e",
  "#a78bfa",
  "#ef4444",
  "#eab308",
  "#06b6d4",
  "#6b7280",
];

function blockTimeAgo(timestampSec: number): string {
  const min = Math.floor((Date.now() - timestampSec * 1000) / 60_000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  return `${Math.floor(min / 60)}시간 전`;
}

export function PoolShareChart({
  pools,
}: {
  pools: { name: string; slug: string; blockCount: number; sharePct: number }[];
}) {
  return (
    <Card>
      <CardContent>
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <ResponsiveContainer width={160} height={160} className="shrink-0">
            <PieChart>
              <Pie
                data={pools}
                dataKey="sharePct"
                startAngle={90}
                endAngle={-270}
                innerRadius="60%"
                outerRadius="85%"
                strokeWidth={0}
              >
                {pools.map((p, i) => (
                  <Cell key={p.slug} fill={POOL_COLORS[i % POOL_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <ul className="grid w-full grid-cols-1 gap-1.5 sm:flex-1 sm:grid-cols-2">
            {pools.map((p, i) => (
              <li
                key={p.slug}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: POOL_COLORS[i % POOL_COLORS.length] }}
                  />
                  <span className="truncate">{p.name}</span>
                </span>
                <span className="text-muted-foreground shrink-0 tabular-nums">
                  {p.sharePct}% · {p.blockCount}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export function RecentBlocksList({
  blocks,
}: {
  blocks: {
    height: number;
    timestamp: number;
    poolName: string;
    txCount: number;
    sizeMB: number;
    rewardBTC: number;
    medianFee: number;
  }[];
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <ul className="divide-y">
          {blocks.map((b) => (
            <li
              key={b.height}
              className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
            >
              <div className="min-w-0">
                <p className="font-semibold">#{b.height.toLocaleString()}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {b.poolName} · {blockTimeAgo(b.timestamp)}
                </p>
              </div>
              <div className="text-muted-foreground shrink-0 text-right text-xs tabular-nums">
                <p>
                  {b.txCount.toLocaleString()} tx · {b.sizeMB} MB
                </p>
                <p>
                  ~{b.medianFee} sat/vB · {b.rewardBTC} BTC
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function MempoolBlocksViz({
  blocks,
}: {
  blocks: {
    medianFee: number;
    feeMin: number;
    feeMax: number;
    nTx: number;
    vMB: number;
  }[];
}) {
  return (
    <Card>
      <CardContent>
        {blocks.length === 0 ? (
          <p className="text-muted-foreground text-sm">대기 중인 블록 없음</p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {blocks.map((b, i) => (
              <div
                key={i}
                className="flex min-w-[120px] flex-col items-center gap-1 rounded-md border border-purple-500/30 bg-gradient-to-b from-purple-600/30 to-purple-800/30 px-3 py-3 text-center"
              >
                <span className="text-sm font-bold">
                  ~{b.medianFee} sat/vB
                </span>
                <span className="text-muted-foreground text-xs">
                  {b.feeMin}–{b.feeMax} sat/vB
                </span>
                <span className="text-muted-foreground text-xs">
                  {b.vMB} vMB · {b.nTx.toLocaleString()} tx
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function Section({
  title,
  relativeTime,
  children,
}: {
  title: string;
  relativeTime?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-muted-foreground text-sm font-semibold">{title}</h2>
        {relativeTime && (
          <span className="text-muted-foreground text-xs">{relativeTime}</span>
        )}
      </div>
      {children}
    </section>
  );
}

export function Stat({
  label,
  value,
  valueClassName,
  change,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  change?: number;
}) {
  return (
    <div className="text-center">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className={cn("mt-0.5 font-bold", valueClassName)}>{value}</p>
      {change !== undefined && (
        <p
          className={cn(
            "mt-0.5 text-xs",
            change >= 0 ? "text-green-400" : "text-red-400",
          )}
        >
          {change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(2)}% 1주 전 대비
        </p>
      )}
    </div>
  );
}

export function StatSkeleton({ hasChange = false }: { hasChange?: boolean }) {
  return (
    <div className="text-center">
      <Skeleton className="mx-auto h-3 w-16" />
      <Skeleton className="mx-auto mt-0.5 h-4 w-12" />
      {hasChange && <Skeleton className="mx-auto mt-0.5 h-3 w-24" />}
    </div>
  );
}

export function DonutRing({
  progress,
  color,
  center,
  centerColor,
  centerSub,
}: {
  progress: number;
  color: string;
  center: string;
  centerColor?: string;
  centerSub?: string;
}) {
  const data = [
    { value: Math.min(progress, 100), fill: color },
    { value: Math.max(100 - progress, 0), fill: "hsl(var(--muted))" },
  ];
  return (
    <div className="relative shrink-0">
      <ResponsiveContainer width={140} height={140}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            innerRadius="62%"
            outerRadius="82%"
            strokeWidth={0}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.fill} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span
          className="text-lg leading-none font-bold"
          style={{ color: centerColor }}
        >
          {center}
        </span>
        {centerSub && (
          <span className="text-muted-foreground text-xs">{centerSub}</span>
        )}
      </div>
    </div>
  );
}
