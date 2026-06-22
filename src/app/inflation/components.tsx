"use client";

import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useCountUp } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";

export type Currency = "$" | "₩";

/** 통화 포맷터 생성. 음수는 마이너스 부호 "−" 사용(money-creation 컨벤션). */
export function makeMoneyFmt(currency: Currency) {
  return (n: number) => {
    const abs = Math.round(Math.abs(n));
    const sign = n < 0 ? "−" : "";
    return currency === "$"
      ? `${sign}$${abs.toLocaleString("en-US")}`
      : `${sign}${abs.toLocaleString("ko-KR")}원`;
  };
}

export const fmtMultiple = (n: number) => `×${n.toFixed(n >= 100 ? 0 : 1)}`;
export const fmtHours = (n: number) => `${n.toFixed(1)}시간`;

/** useCountUp으로 애니메이션되는 지표 카드. */
export function StatCard({
  label,
  value,
  format,
  sub,
  accent,
  tone,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  sub?: string;
  accent?: boolean;
  tone?: "good" | "bad";
}) {
  const animated = useCountUp(value);
  return (
    <Card className="gap-1 p-4">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span
        className={cn(
          "font-mono text-xl font-semibold tabular-nums",
          accent && "text-amber-600 dark:text-amber-400",
          tone === "good" && "text-emerald-600 dark:text-emerald-400",
          tone === "bad" && "text-rose-600 dark:text-rose-400",
        )}
      >
        {format(animated)}
      </span>
      {sub && <span className="text-muted-foreground text-xs">{sub}</span>}
    </Card>
  );
}

/** 데이터 없음(범위 밖·키 미설정) 자리표시 카드. */
export function EmptyCard({ label, note }: { label: string; note: string }) {
  return (
    <Card className="gap-1 p-4">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-muted-foreground font-mono text-xl font-semibold">
        —
      </span>
      <span className="text-muted-foreground text-xs">{note}</span>
    </Card>
  );
}

/** 시작연도·원금 등 슬라이더 한 줄. */
export function SliderRow({
  label,
  valueLabel,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  valueLabel: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="font-mono tabular-nums">{valueLabel}</span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        className="py-1"
      />
    </div>
  );
}
