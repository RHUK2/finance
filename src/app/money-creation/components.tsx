"use client";

import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCountUp } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";

import type { Line, Sheet } from "./steps";

const fmt = (n: number) =>
  `${n < 0 ? "−" : ""}${Math.abs(Math.round(n)).toLocaleString("ko-KR")}`;

function AmountRow({
  line,
  side,
}: {
  line: Line;
  side: "asset" | "liability";
}) {
  const value = useCountUp(line.amount);
  const isCapital = line.item === "자본";
  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-bottom-1 flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-sm duration-300",
        side === "asset"
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-rose-500/30 bg-rose-500/5",
        isCapital && "border-border bg-muted/40 text-muted-foreground",
        line.flowChanged &&
          "border-sky-500/70 bg-sky-500/15 ring-1 ring-sky-500/60",
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
  const debts = sheet.liability.filter((l) => l.item !== "자본");
  const capital = sheet.liability.filter((l) => l.item === "자본");
  const hasCreated = [...sheet.asset, ...sheet.liability].some(
    (l) => l.created,
  );
  const hasFlow = [...sheet.asset, ...sheet.liability].some(
    (l) => l.flowChanged,
  );
  const isEmpty = sheet.asset.length === 0 && sheet.liability.length === 0;

  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden p-0 transition-shadow",
        hasCreated && "shadow-lg ring-2 ring-amber-500/50",
        !hasCreated && hasFlow && "shadow-lg ring-2 ring-sky-500/50",
      )}
    >
      <div className="flex items-baseline justify-between border-b px-3 py-2">
        <span className="font-semibold">{name}</span>
        <span className="text-muted-foreground text-xs">{sub}</span>
      </div>

      <CardContent className="p-3">
        {hasCreated && (
          <div className="mb-2 flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
            <Sparkles className="size-3.5" />
            無에서 자산·부채가 동시에 생성됨
          </div>
        )}
        {!hasCreated && hasFlow && (
          <div className="mb-2 flex items-center gap-1 text-xs font-medium text-sky-600 dark:text-sky-400">
            <ArrowLeftRight className="size-3.5" />
            기존의 돈이 이동·변환됨
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
            {debts.length > 0 && (
              <>
                <div className="text-xs font-medium text-rose-600 dark:text-rose-400">
                  부채
                </div>
                {debts.map((l) => (
                  <AmountRow key={l.item} line={l} side="liability" />
                ))}
              </>
            )}
            {capital.length > 0 && (
              <>
                <div className="text-muted-foreground text-xs font-medium">
                  자본(순자산)
                </div>
                {capital.map((l) => (
                  <AmountRow key={l.item} line={l} side="liability" />
                ))}
              </>
            )}
          </div>
        </div>

        {!isEmpty && (
          <div className="text-muted-foreground mt-3 flex items-center justify-between border-t pt-2 text-xs">
            <span className="font-mono tabular-nums">
              자산 {fmt(assetTotal)}
            </span>
            <span
              className={cn(
                assetTotal === liabTotal
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600",
              )}
            >
              {assetTotal === liabTotal ? "균형 ✓" : "불균형"}
            </span>
            <span className="font-mono tabular-nums">
              부채·자본 {fmt(liabTotal)}
            </span>
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
      <span className="text-muted-foreground text-xs">{label}</span>
      <span
        className={cn(
          "font-mono text-2xl font-semibold tabular-nums",
          accent && "text-amber-600 dark:text-amber-400",
        )}
      >
        {suffix === "배" ? animated.toFixed(1) : fmt(animated)}
        {suffix && (
          <span className="ml-0.5 text-base font-normal">{suffix}</span>
        )}
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
      <Button
        variant="outline"
        size="sm"
        onClick={onPrev}
        disabled={step === 0}
      >
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
              i === step
                ? "bg-primary"
                : "bg-muted hover:bg-muted-foreground/40",
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
        <span className="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs leading-none font-semibold">
          <span className="translate-y-[1px]">{index}</span>
        </span>
        <span className="font-semibold">{title}</span>
      </div>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {narration}
      </p>
    </Card>
  );
}

const ASSET_GROUPS = [
  {
    title: "자산",
    color: "text-emerald-600 dark:text-emerald-400",
    desc: "내가 가진 가치 있는 것 (왼쪽)",
    items: ["현금·예금", "부동산·주식", "보유 국채", "대출해 준 돈(채권)"],
  },
  {
    title: "부채",
    color: "text-rose-600 dark:text-rose-400",
    desc: "남에게 갚아야 할 것 (오른쪽)",
    items: ["대출·차입금", "발행한 국채", "외상 매입금", "예금(은행 입장)"],
  },
  {
    title: "자본(순자산)",
    color: "text-muted-foreground",
    desc: "자산에서 부채를 뺀 내 몫",
    items: ["자기자본", "이익잉여금", "정부의 순자산(±)"],
  },
];

export function AssetEquationCard() {
  return (
    <Card className="gap-3 p-4">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-semibold">자산 = 부채 + 자본</span>
        <span className="text-muted-foreground text-xs">
          모든 대차대조표가 항상 “균형 ✓”인 이유 — 자산은 누군가의 빚(부채)이나
          내 몫(자본)으로 정확히 채워진다.
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {ASSET_GROUPS.map((g) => (
          <div key={g.title} className="rounded-md border p-3">
            <div className={cn("text-sm font-medium", g.color)}>{g.title}</div>
            <p className="text-muted-foreground mt-0.5 text-xs">{g.desc}</p>
            <ul className="text-muted-foreground mt-2 space-y-1 text-xs">
              {g.items.map((it) => (
                <li key={it} className="flex gap-1.5">
                  <span className="text-muted-foreground/50">·</span>
                  {it}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function TrustSection() {
  return (
    <Card className="mt-2 gap-2 p-4">
      <span className="font-semibold">자산의 가치는 결국 “상호합의”다</span>
      <div className="text-muted-foreground space-y-2 text-sm leading-relaxed">
        <p>
          지금까지 본 것처럼 돈은 무에서 만들어진다. 그렇다면 그 돈은 왜
          가치를 가질까? 종이 화폐 자체에는 내재가치가 없다. 가치는 “모두가
          이것을 가치 있게 받아들인다”는 인간들의 상호합의에서 나온다.
        </p>
        <p>
          오늘날 달러를 뒷받침하는 것은 금이 아니라 <strong>신뢰</strong>다 —
          세계 최강의 군사력, 원유를 달러로 결제하는 페트로달러 체제, 미국채에
          대한 전 세계의 수요가 그 신뢰를 떠받친다. 1971년 금태환이 중단된 뒤
          달러는 “금으로 바꿔준다”는 약속이 아니라 이 신뢰망 위에 서 있다.
        </p>
        <p>
          금 이전에도 합의의 대상은 계속 바뀌어 왔다. 조개껍데기·소금·곡물·돌
          화폐(라이 스톤)처럼, 그 사회가 “이건 희소하고 위조하기 어려우며 모두가
          받아준다”고 합의한 것이 그때그때 돈의 역할을 했다. 무엇이 돈이 되느냐는
          물질이 아니라 합의가 결정한다.
        </p>
      </div>
    </Card>
  );
}
