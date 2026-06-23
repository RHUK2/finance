import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/hooks/use-relative-time";
import { useScrollDrag } from "@/hooks/use-scroll-drag";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

const MAX_BLOCK_MB = 1.0;

function CardHeading({ title, relativeTime }: { title?: string; relativeTime?: string }) {
  if (!title) return null;
  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle className="text-muted-foreground text-sm font-medium">{title}</CardTitle>
        {relativeTime && <span className="text-muted-foreground text-xs">{relativeTime}</span>}
      </div>
    </CardHeader>
  );
}

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
  return formatRelativeTime(timestampSec * 1000);
}

export function PoolShareChart({
  pools,
  title,
  relativeTime,
  description,
}: {
  pools?: { name: string; slug: string; blockCount: number; sharePct: number }[];
  title?: string;
  relativeTime?: string;
  description?: string;
}) {
  return (
    <Card>
      <CardHeading title={title} relativeTime={relativeTime} />
      <CardContent>
        {!pools ? (
          <Skeleton className="h-[160px] w-full" />
        ) : (
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
                <li key={p.slug} className="flex items-center justify-between gap-2 text-sm">
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
        )}
        {description && (
          <p className="bg-muted/50 text-muted-foreground mt-4 rounded-md px-3 py-2.5 text-xs">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function RecentBlocksList({
  blocks,
  title,
  relativeTime,
  description,
}: {
  blocks?: {
    height: number;
    timestamp: number;
    poolName: string;
    txCount: number;
    sizeMB: number;
    rewardBTC: number;
    medianFee: number;
  }[];
  title?: string;
  relativeTime?: string;
  description?: string;
}) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <Card>
      <CardHeading title={title} relativeTime={relativeTime} />
      <CardContent className="p-0">
        {!blocks ? (
          <Skeleton className="mx-6 h-[270px]" />
        ) : (
          <ul className="divide-y">
            {blocks.map((b) => (
              <li key={b.height} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono font-bold">#{b.height.toLocaleString()}</p>
                    <p className="text-muted-foreground mt-0.5 truncate text-xs">
                      {b.poolName} · {blockTimeAgo(b.timestamp)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="tabular-nums font-semibold text-amber-400">{b.rewardBTC} BTC</p>
                    <p className="text-muted-foreground mt-0.5 text-xs tabular-nums">
                      {b.txCount.toLocaleString()} tx · ~{b.medianFee} sat/vB
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="bg-muted h-1 flex-1 overflow-hidden rounded-full">
                    <div
                      className="h-full rounded-full bg-blue-500/60"
                      style={{ width: `${Math.min((b.sizeMB / MAX_BLOCK_MB) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground w-12 text-right text-[10px] tabular-nums">{b.sizeMB} MB</span>
                </div>
              </li>
            ))}
          </ul>
        )}
        {description && (
          <div className="px-4 pb-4 pt-3">
            <p className="bg-muted/50 text-muted-foreground rounded-md px-3 py-2.5 text-xs">{description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MempoolBlocksViz({
  blocks,
  title,
  relativeTime,
  description,
}: {
  blocks?: {
    medianFee: number;
    feeMin: number;
    feeMax: number;
    nTx: number;
    vMB: number;
  }[];
  title?: string;
  relativeTime?: string;
  description?: string;
}) {
  const { ref, handlers, maskStyle } = useScrollDrag();

  return (
    <Card>
      <CardHeading title={title} relativeTime={relativeTime} />
      <CardContent>
        {!blocks ? (
          <Skeleton className="h-[88px] w-full" />
        ) : blocks.length === 0 ? (
          <p className="text-muted-foreground text-sm">대기 중인 블록 없음</p>
        ) : (
          <div
            ref={ref}
            className="cursor-grab select-none overflow-x-auto pb-3 pr-3 [scrollbar-width:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
            style={maskStyle}
            {...handlers}
          >
            <div className="flex w-max gap-4">
              {blocks.map((b, i) => {
                const fillPct = Math.min((b.vMB / MAX_BLOCK_MB) * 100, 100);
                return (
                  <div key={i} className="relative">
                    {/* 3D 깊이 레이어 */}
                    <div className="absolute inset-0 rounded-md bg-purple-950" style={{ transform: "translate(6px, 6px)" }} />
                    <div className="absolute inset-0 rounded-md bg-purple-900/70" style={{ transform: "translate(3px, 3px)" }} />
                    {/* 전면 */}
                    <div className="relative flex min-w-[128px] flex-col gap-2 rounded-md border border-purple-400/40 bg-gradient-to-b from-purple-600 to-purple-800 px-3 py-3 text-purple-100">
                      <div className="text-purple-200/90 text-[10px]">#{i + 1} 예상 블록</div>
                      <div className="text-center">
                        <span className="text-xl font-bold tabular-nums leading-none text-white">~{b.medianFee}</span>
                        <span className="text-purple-200/90 ml-1 text-xs">sat/vB</span>
                      </div>
                      <div className="text-purple-200/90 text-center text-[10px] tabular-nums">
                        {b.feeMin}–{b.feeMax} sat/vB
                      </div>
                      {/* 블록 충전율 */}
                      <div className="h-1 w-full overflow-hidden rounded-full bg-purple-950/60">
                        <div className="h-full rounded-full bg-purple-300" style={{ width: `${fillPct}%` }} />
                      </div>
                      <div className="text-purple-200/90 flex justify-between text-[10px] tabular-nums">
                        <span>{b.vMB} vMB</span>
                        <span>{b.nTx.toLocaleString()} tx</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {description && (
          <p className="bg-muted/50 text-muted-foreground mt-3 rounded-md px-3 py-2.5 text-xs">{description}</p>
        )}
      </CardContent>
    </Card>
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
        <p className={cn("mt-0.5 text-xs", change >= 0 ? "text-green-400" : "text-red-400")}>
          {change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(2)}% 1주 전 대비
        </p>
      )}
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
        <span className="text-lg leading-none font-bold" style={{ color: centerColor }}>
          {center}
        </span>
        {centerSub && <span className="text-muted-foreground text-xs">{centerSub}</span>}
      </div>
    </div>
  );
}
