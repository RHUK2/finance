import { cn } from "@/lib/utils";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
} from "recharts";

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-muted-foreground mb-3 text-sm font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Stat({
  label,
  value,
  sub,
  valueClassName,
}: {
  label: string;
  value: string;
  sub?: string;
  valueClassName?: string;
}) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className={cn("mt-0.5 font-bold", valueClassName)}>{value}</p>
      {sub && <p className="text-muted-foreground mt-0.5 text-xs">{sub}</p>}
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
          className="text-lg font-bold leading-none"
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
