"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { InflationData } from "@/hooks/use-inflation";
import {
  compoundDeposit,
  grow,
  latestValue,
  valueAt,
  type Point,
} from "@/lib/inflation-models";

import {
  EmptyCard,
  SliderRow,
  StatCard,
  fmtMultiple,
  makeMoneyFmt,
  type Currency,
} from "./components";

type Basis = "M2" | "CPI";
type Tone = "strong" | "bad" | "good" | "amber";

const BASIS_LABELS: Record<Basis, { ref: string; hold: string }> = {
  M2: { ref: "통화량(M2)", hold: "통화량 가치 유지선" },
  CPI: { ref: "물가(CPI)", hold: "구매력 유지선" },
};

type Props = {
  data: InflationData;
  btc?: Point[];
  currency: Currency;
  minYear: number;
  maxYear: number;
  amount: number;
  stockLabel: string;
};

export function CollapseCalculator({
  data,
  btc,
  currency,
  minYear,
  maxYear,
  amount,
  stockLabel,
}: Props) {
  const [startYear, setStartYear] = useState(
    Math.max(minYear, Math.min(maxYear, 2000)),
  );
  const [basis, setBasis] = useState<Basis>("M2");
  const money = makeMoneyFmt(currency);

  const r = useMemo(() => {
    const refHist = basis === "M2" ? data.m2?.history : data.cpi?.history;
    const assetDefs = [
      { key: "stock", label: stockLabel, series: data.stock?.history },
      { key: "house", label: "주택", series: data.house?.history },
      { key: "btc", label: "비트코인", series: btc },
    ] as const;

    const depositNominal = compoundDeposit(
      amount,
      data.deposit?.history,
      startYear,
    );
    const rStart = valueAt(refHist, startYear);
    const rNow = latestValue(refHist);
    const ratio = rStart && rNow ? rNow / rStart : null;
    const assets = assetDefs.map((a) => ({
      key: a.key,
      label: a.label,
      value: grow(amount, valueAt(a.series, startYear), latestValue(a.series)),
    }));

    const holdLine = ratio != null ? amount * ratio : null;
    const lossPct =
      depositNominal != null && holdLine
        ? (depositNominal / holdLine - 1) * 100
        : null;
    const gap =
      depositNominal != null && holdLine != null
        ? depositNominal - holdLine
        : null;
    const headline = assets.find((a) => a.value != null);

    return {
      depositNominal,
      holdLine,
      lossPct,
      gap,
      ratio,
      assets,
      headline,
    };
  }, [data, btc, startYear, amount, basis, stockLabel]);

  const { ref: refName, hold: holdLabel } = BASIS_LABELS[basis];

  const realTone: Tone = r.lossPct != null && r.lossPct < 0 ? "bad" : "good";
  const hi = (text: string, tone: Tone) => (
    <span
      className={cn(
        "font-semibold",
        tone === "strong" && "text-foreground",
        tone === "bad" && "text-rose-600 dark:text-rose-400",
        tone === "good" && "text-emerald-600 dark:text-emerald-400",
        tone === "amber" && "text-amber-600 dark:text-amber-400",
      )}
    >
      {text}
    </span>
  );

  const ready =
    r.depositNominal != null &&
    r.holdLine != null &&
    r.ratio != null &&
    r.lossPct != null;
  const head = r.headline;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">구매력 붕괴 계산기</CardTitle>
        <p className="text-muted-foreground text-sm">
          과거에 {money(amount)}을 예금에 두었다면 오늘 그 가치가 어떻게
          변했을까요? 기준을 통화량(M2)·물가(CPI)로 바꿔, 같은 돈을 자산에 넣었을
          경우와 비교합니다.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">기준</span>
          {(["M2", "CPI"] as const).map((b) => (
            <Button
              key={b}
              size="sm"
              variant={basis === b ? "default" : "outline"}
              onClick={() => setBasis(b)}
            >
              {b === "M2" ? "통화량(M2)" : "물가(CPI)"}
            </Button>
          ))}
        </div>

        <SliderRow
          label="시작 연도"
          valueLabel={`${startYear}년`}
          min={minYear}
          max={maxYear}
          step={1}
          value={startYear}
          onChange={setStartYear}
        />

        <p className="bg-muted/40 rounded-lg border p-4 text-sm leading-relaxed">
          {ready ? (
            <>
              {startYear}년에 {hi(money(amount), "strong")}을 예금에 넣었다면
              오늘 통장엔 {hi(money(r.depositNominal!), "strong")}(명목)입니다.
              하지만 같은 기간 {refName}이{" "}
              {hi(`${r.ratio!.toFixed(1)}배`, "amber")} 늘어, 같은 값어치를
              유지하려면 오늘 {hi(money(r.holdLine!), "strong")}이 있어야 합니다 —
              통장은 유지선 대비{" "}
              {hi(`${Math.abs(r.lossPct!).toFixed(0)}%`, realTone)}{" "}
              {r.lossPct! < 0 ? "부족합니다" : "초과합니다"}.
              {head && head.value != null ? (
                <>
                  {" "}
                  같은 돈을 {head.label}에 넣었다면{" "}
                  {hi(
                    `${money(head.value)} (×${(head.value / amount).toFixed(1)})`,
                    "good",
                  )}
                  였습니다.
                </>
              ) : null}
            </>
          ) : (
            `${startYear}년은 선택한 기준(${refName})의 데이터 범위 밖입니다. 시작 연도를 올려보세요.`
          )}
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard
            label="통장 잔고 (명목)"
            value={r.depositNominal ?? amount}
            format={money}
          />
          <StatCard
            label={holdLabel}
            value={r.holdLine ?? amount}
            format={money}
            sub={r.ratio != null ? `${refName} ×${r.ratio.toFixed(1)}` : "—"}
          />
          <StatCard
            label="유지선 대비"
            value={r.gap ?? 0}
            format={money}
            tone={r.lossPct != null && r.lossPct < 0 ? "bad" : "good"}
            sub={
              r.lossPct != null
                ? `${r.lossPct >= 0 ? "+" : ""}${r.lossPct.toFixed(0)}%`
                : "데이터 범위 밖"
            }
          />
        </div>

        <div>
          <div className="text-muted-foreground mb-2 text-xs font-medium">
            같은 원금을 자산에 넣었다면
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {r.assets.map((a) =>
              a.value == null ? (
                <EmptyCard
                  key={a.key}
                  label={a.label}
                  note={`${startYear}년 데이터 없음`}
                />
              ) : (
                <StatCard
                  key={a.key}
                  label={a.label}
                  value={a.value}
                  format={money}
                  accent
                  sub={fmtMultiple(a.value / amount)}
                />
              ),
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
