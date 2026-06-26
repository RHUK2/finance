"use client";

import { Pause, Play, RotateCcw, StepForward } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

// 에이전트 격자 — 상태별 배경색 className 배열을 받아 사각형으로 렌더링.
// 라운드마다 색이 바뀌며 transition-colors로 부드럽게 전환된다.
export function AgentGrid({ states }: { states: string[] }) {
  return (
    <div
      className="grid gap-1"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(13px, 1fr))" }}
    >
      {states.map((c, i) => (
        <div
          key={i}
          className={cn(
            "aspect-square rounded-[3px] transition-colors duration-300",
            c,
          )}
        />
      ))}
    </div>
  );
}

const SPEEDS = [
  { label: "0.5×", ms: 1100 },
  { label: "1×", ms: 600 },
  { label: "2×", ms: 280 },
];

// 라운드 컨트롤 — 재생/일시정지 · 한 라운드 · 리셋 · 속도.
export function RoundControls({
  playing,
  onToggle,
  onStep,
  onReset,
  round,
  speedMs,
  onSpeed,
  done,
}: {
  playing: boolean;
  onToggle: () => void;
  onStep: () => void;
  onReset: () => void;
  round: number;
  speedMs: number;
  onSpeed: (ms: number) => void;
  done?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" onClick={onToggle} disabled={done} className="gap-1.5">
        {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        {playing ? "일시정지" : done ? "완료" : "재생"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={onStep}
        disabled={playing || done}
        className="gap-1.5"
      >
        <StepForward className="size-4" />한 라운드
      </Button>
      <Button size="sm" variant="outline" onClick={onReset} className="gap-1.5">
        <RotateCcw className="size-4" />
        리셋
      </Button>
      <div className="ml-auto flex items-center gap-2">
        <span className="text-muted-foreground text-sm tabular-nums">
          라운드 {round}
        </span>
        <div className="flex overflow-hidden rounded-md border">
          {SPEEDS.map((s) => (
            <button
              key={s.ms}
              onClick={() => onSpeed(s.ms)}
              className={cn(
                "px-2 py-1 text-xs tabular-nums transition-colors",
                speedMs === s.ms
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// 슬라이더 컨트롤 한 줄 — 라벨 + 포맷된 값 + 슬라이더.
export function ControlSlider({
  icon,
  label,
  hint,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  format,
}: {
  icon?: React.ReactNode;
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format: (v: number) => string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-medium">
          {icon}
          {label}
        </span>
        <span className="font-mono tabular-nums">{format(value)}</span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
      />
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
}

// 지표 카드.
export function Metric({
  label,
  value,
  tone,
  sub,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad" | "accent";
  sub?: string;
}) {
  return (
    <Card className="gap-1 p-4">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span
        className={cn(
          "font-mono text-xl font-semibold tabular-nums sm:text-2xl",
          tone === "good" && "text-emerald-600 dark:text-emerald-400",
          tone === "bad" && "text-rose-600 dark:text-rose-400",
          tone === "accent" && "text-amber-600 dark:text-amber-400",
        )}
      >
        {value}
      </span>
      {sub && <span className="text-muted-foreground text-xs">{sub}</span>}
    </Card>
  );
}

// 설명 카드 (프로즈).
export function ExplainCard({
  icon,
  title,
  body,
}: {
  icon?: React.ReactNode;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <Card className="gap-2 p-4">
      <span className="flex items-center gap-1.5 font-semibold">
        {icon}
        {title}
      </span>
      <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
    </Card>
  );
}

// 탭 섹션 상단 제목 + 설명.
export function SectionIntro({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
        {children}
      </p>
    </div>
  );
}
