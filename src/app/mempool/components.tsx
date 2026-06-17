import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

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
