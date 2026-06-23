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
  recurringDCA,
  recurringDepositFV,
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
type Mode = "lump" | "recurring";
type Tone = "strong" | "bad" | "good" | "amber";

const BASIS_LABELS: Record<Basis, { ref: string; real: string; hold: string }> = {
  M2: { ref: "통화량(M2)", real: "통화 대비 실질가치", hold: "통화량 가치 유지선" },
  CPI: { ref: "물가(CPI)", real: "실질 구매력", hold: "구매력 유지선" },
};

type Props = {
  data: InflationData;
  btc?: Point[];
  currency: Currency;
  minYear: number;
  maxYear: number;
  principal: { min: number; max: number; step: number; default: number };
  stockLabel: string;
};

export function CollapseCalculator({
  data,
  btc,
  currency,
  minYear,
  maxYear,
  principal,
  stockLabel,
}: Props) {
  const monthlyCfg =
    currency === "$"
      ? { min: 100, max: 5000, step: 100, default: 500 }
      : { min: 100_000, max: 5_000_000, step: 100_000, default: 500_000 };

  const [startYear, setStartYear] = useState(
    Math.max(minYear, Math.min(maxYear, 2000)),
  );
  const [mode, setMode] = useState<Mode>("lump");
  const [amount, setAmount] = useState(principal.default);
  const [basis, setBasis] = useState<Basis>("M2");
  const money = makeMoneyFmt(currency);

  const cfg = mode === "lump" ? principal : monthlyCfg;

  function changeMode(m: Mode) {
    setMode(m);
    setAmount(m === "lump" ? principal.default : monthlyCfg.default);
  }

  const r = useMemo(() => {
    const refHist = basis === "M2" ? data.m2?.history : data.cpi?.history;
    const assetDefs = [
      { key: "stock", label: stockLabel, series: data.stock?.history },
      { key: "house", label: "주택", series: data.house?.history },
      { key: "btc", label: "비트코인", series: btc },
    ] as const;

    let baseAmount: number;
    let depositNominal: number | null;
    let ratio: number | null;
    let assets: { key: string; label: string; value: number | null }[];

    if (mode === "lump") {
      baseAmount = amount;
      depositNominal = compoundDeposit(amount, data.deposit?.history, startYear);
      const rStart = valueAt(refHist, startYear);
      const rNow = latestValue(refHist);
      ratio = rStart && rNow ? rNow / rStart : null;
      assets = assetDefs.map((a) => ({
        key: a.key,
        label: a.label,
        value: grow(amount, valueAt(a.series, startYear), latestValue(a.series)),
      }));
    } else {
      const rec = recurringDepositFV(amount, data.deposit?.history, startYear);
      if (!rec) {
        baseAmount = amount;
        depositNominal = null;
        ratio = null;
        assets = assetDefs.map((a) => ({ key: a.key, label: a.label, value: null }));
      } else {
        baseAmount = amount * rec.months.length;
        depositNominal = rec.fv;
        const hold = recurringDCA(amount, refHist, rec.months);
        ratio = hold != null && baseAmount ? hold / baseAmount : null;
        assets = assetDefs.map((a) => ({
          key: a.key,
          label: a.label,
          value: recurringDCA(amount, a.series, rec.months),
        }));
      }
    }

    const realValue = depositNominal != null && ratio ? depositNominal / ratio : null;
    const lossPct =
      realValue != null && baseAmount ? (realValue / baseAmount - 1) * 100 : null;
    const holdLine = ratio != null ? baseAmount * ratio : null;
    const headline = assets.find((a) => a.value != null);

    return { baseAmount, depositNominal, realValue, lossPct, holdLine, ratio, assets, headline };
  }, [data, btc, startYear, amount, basis, mode, stockLabel]);

  const { ref: refName, real: realLabel, hold: holdLabel } = BASIS_LABELS[basis];
  const productName = mode === "lump" ? "예금" : "적금";

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
    r.depositNominal != null && r.realValue != null && r.ratio != null && r.lossPct != null;
  const head = r.headline;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">구매력 붕괴 계산기</CardTitle>
        <p className="text-muted-foreground text-sm">
          과거에 저축한 돈을 예금·적금에 두었다면 오늘 그 가치가 어떻게
          변했을까요? 기준을 통화량(M2)·물가(CPI)로 바꿔, 같은 돈을 자산에 넣었을
          경우와 비교합니다.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">방식</span>
            {(["lump", "recurring"] as const).map((m) => (
              <Button
                key={m}
                size="sm"
                variant={mode === m ? "default" : "outline"}
                onClick={() => changeMode(m)}
              >
                {m === "lump" ? "거치식(예금)" : "적립식(적금)"}
              </Button>
            ))}
          </div>
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
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <SliderRow
            label="시작 연도"
            valueLabel={`${startYear}년`}
            min={minYear}
            max={maxYear}
            step={1}
            value={startYear}
            onChange={setStartYear}
          />
          <SliderRow
            label={mode === "lump" ? "원금" : "월 납입액"}
            valueLabel={money(amount)}
            min={cfg.min}
            max={cfg.max}
            step={cfg.step}
            value={amount}
            onChange={setAmount}
          />
        </div>

        <p className="bg-muted/40 rounded-lg border p-4 text-sm leading-relaxed">
          {ready ? (
            <>
              {mode === "lump" ? (
                <>
                  {startYear}년에 {hi(money(amount), "strong")}을 예금에 넣었다면
                  오늘 통장엔 {hi(money(r.depositNominal!), "strong")}이 찍힙니다.
                </>
              ) : (
                <>
                  {startYear}년부터 매달 {hi(money(amount), "strong")}씩 총{" "}
                  {hi(money(r.baseAmount), "strong")}를 적금에 부었다면 오늘{" "}
                  {hi(money(r.depositNominal!), "strong")}입니다.
                </>
              )}{" "}
              하지만 같은 기간 {refName}은 {hi(`${r.ratio!.toFixed(1)}배`, "amber")}{" "}
              늘어{mode === "recurring" ? "(가중평균)" : ""}, 그 돈의 {realLabel}는{" "}
              {hi(money(r.realValue!), realTone)} 수준 —{" "}
              {mode === "lump" ? "시작 시점" : "총 납입"} 대비{" "}
              {hi(`${Math.abs(r.lossPct!).toFixed(0)}%`, realTone)}{" "}
              {r.lossPct! < 0 ? "줄었습니다" : "늘었습니다"}.
              {head && head.value != null ? (
                <>
                  {" "}같은 돈을 {mode === "recurring" ? "매달 " : ""}
                  {head.label}에 {mode === "recurring" ? "적립했다면" : "넣었다면"}{" "}
                  {hi(
                    `${money(head.value)} (×${(head.value / r.baseAmount).toFixed(1)})`,
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
            label={mode === "lump" ? "예금에 넣었다면 (명목)" : "적금 만기 (명목)"}
            value={r.depositNominal ?? r.baseAmount}
            format={money}
            sub={mode === "recurring" ? `총 납입 ${money(r.baseAmount)}` : undefined}
          />
          <StatCard
            label={`${productName}의 ${realLabel}`}
            value={r.realValue ?? r.baseAmount}
            format={money}
            tone={r.lossPct != null && r.lossPct < 0 ? "bad" : undefined}
            sub={
              r.lossPct != null
                ? `${mode === "lump" ? "시작 시점" : "총 납입"} 대비 ${r.lossPct >= 0 ? "+" : ""}${r.lossPct.toFixed(0)}%`
                : "데이터 범위 밖"
            }
          />
          <StatCard
            label={holdLabel}
            value={r.holdLine ?? r.baseAmount}
            format={money}
            sub={
              r.ratio != null
                ? `${refName} ×${r.ratio.toFixed(1)}${mode === "recurring" ? " (가중평균)" : ""}`
                : "—"
            }
          />
        </div>

        <div>
          <div className="text-muted-foreground mb-2 text-xs font-medium">
            {mode === "lump"
              ? "같은 원금을 자산에 넣었다면"
              : "같은 돈을 매달 자산에 적립했다면"}
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
                  sub={fmtMultiple(a.value / r.baseAmount)}
                />
              ),
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
