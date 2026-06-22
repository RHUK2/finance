"use client";

import { ChevronLeft, ChevronRight, RotateCcw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCountUp } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";

import type { Line, Sheet } from "./steps";

const fmt = (n: number) =>
  `${n < 0 ? "−" : ""}${Math.abs(Math.round(n)).toLocaleString("ko-KR")}`;

function AmountRow({ line, side }: { line: Line; side: "asset" | "liability" }) {
  const value = useCountUp(line.amount);
  const isCapital = line.item === "자본";
  return (
    <div
      className={cn(
        "flex animate-in items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-sm duration-300 fade-in slide-in-from-bottom-1",
        side === "asset"
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-rose-500/30 bg-rose-500/5",
        isCapital && "border-border bg-muted/40 text-muted-foreground",
        line.created &&
          "animate-pulse border-amber-500/70 bg-amber-500/15 ring-1 ring-amber-500/60",
      )}
    >
      <span className="truncate">{line.item}</span>
      <span className="font-mono tabular-nums">{fmt(value)}</span>
    </div>
  );
}

function totalOf(lines: Line[]) {
  return lines.reduce((sum, l) => sum + l.amount, 0);
}

export function BalanceSheet({
  name,
  sub,
  sheet,
}: {
  name: string;
  sub: string;
  sheet: Sheet;
}) {
  const assetTotal = totalOf(sheet.asset);
  const liabTotal = totalOf(sheet.liability);
  const hasCreated = [...sheet.asset, ...sheet.liability].some((l) => l.created);
  const isEmpty = sheet.asset.length === 0 && sheet.liability.length === 0;

  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden p-0 transition-shadow",
        hasCreated && "shadow-lg ring-2 ring-amber-500/50",
      )}
    >
      <div className="flex items-baseline justify-between border-b px-3 py-2">
        <span className="font-semibold">{name}</span>
        <span className="text-xs text-muted-foreground">{sub}</span>
      </div>

      <CardContent className="p-3">
        {hasCreated && (
          <div className="mb-2 flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
            <Sparkles className="size-3.5" />
            無에서 자산·부채가 동시에 생성됨
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              자산
            </div>
            {sheet.asset.map((l) => (
              <AmountRow key={l.item} line={l} side="asset" />
            ))}
          </div>
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-rose-600 dark:text-rose-400">
              부채·자본
            </div>
            {sheet.liability.map((l) => (
              <AmountRow key={l.item} line={l} side="liability" />
            ))}
          </div>
        </div>

        {!isEmpty && (
          <div className="mt-3 flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
            <span className="font-mono tabular-nums">자산 {fmt(assetTotal)}</span>
            <span className={cn(assetTotal === liabTotal ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600")}>
              {assetTotal === liabTotal ? "균형 ✓" : "불균형"}
            </span>
            <span className="font-mono tabular-nums">부채·자본 {fmt(liabTotal)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MoneyCounter({
  label,
  value,
  suffix = "",
  accent = false,
}: {
  label: string;
  value: number;
  suffix?: string;
  accent?: boolean;
}) {
  const animated = useCountUp(value);
  return (
    <Card className="gap-1 p-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-mono text-2xl font-semibold tabular-nums",
          accent && "text-amber-600 dark:text-amber-400",
        )}
      >
        {suffix === "배" ? animated.toFixed(1) : fmt(animated)}
        {suffix && <span className="ml-0.5 text-base font-normal">{suffix}</span>}
      </span>
    </Card>
  );
}

export function StepControls({
  step,
  total,
  onPrev,
  onNext,
  onReset,
  onJump,
}: {
  step: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
  onJump: (i: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={onPrev} disabled={step === 0}>
        <ChevronLeft className="size-4" /> 이전
      </Button>
      <Button size="sm" onClick={onNext} disabled={step === total - 1}>
        다음 단계 <ChevronRight className="size-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={onReset} disabled={step === 0}>
        <RotateCcw className="size-4" /> 리셋
      </Button>
      <div className="ml-auto flex items-center gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            aria-label={`${i}단계로 이동`}
            onClick={() => onJump(i)}
            className={cn(
              "size-2.5 rounded-full transition-colors",
              i === step ? "bg-primary" : "bg-muted hover:bg-muted-foreground/40",
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function NarrationCard({
  index,
  title,
  narration,
}: {
  index: number;
  title: string;
  narration: string;
}) {
  return (
    <Card className="gap-2 p-4">
      <div className="flex items-center gap-2">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {index}
        </span>
        <span className="font-semibold">{title}</span>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{narration}</p>
    </Card>
  );
}
