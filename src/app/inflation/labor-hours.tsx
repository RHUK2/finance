"use client";

import { useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InflationData } from "@/hooks/use-inflation";
import {
  compoundDeposit,
  grow,
  latestValue,
  minWageAt,
  valueAt,
  type Point,
} from "@/lib/inflation-models";

import {
  EmptyCard,
  SliderRow,
  StatCard,
  fmtHours,
  makeMoneyFmt,
  type Currency,
} from "./components";

type Props = {
  data: InflationData;
  btc?: Point[];
  currency: Currency;
  minYear: number;
  maxYear: number;
  wageTable: { year: number; wage: number }[];
};

export function LaborHours({
  data,
  btc,
  currency,
  minYear,
  maxYear,
  wageTable,
}: Props) {
  const [startYear, setStartYear] = useState(
    Math.max(minYear, Math.min(maxYear, 2000)),
  );
  const money = makeMoneyFmt(currency);

  const r = useMemo(() => {
    const wage = minWageAt(wageTable, startYear); // 시작연도 시급 = 1시간 노동
    const currentWage = minWageAt(wageTable, maxYear);
    if (wage == null || currentWage == null) {
      return { wage, currentWage, entries: [] as ReturnType<typeof build> };
    }

    function build() {
      const list: {
        key: string;
        label: string;
        value: number | null;
      }[] = [
        {
          key: "deposit",
          label: "예금",
          value: compoundDeposit(wage!, data.deposit?.history, startYear),
        },
        {
          key: "stock",
          label: "주식 (나스닥)",
          value: grow(
            wage!,
            valueAt(data.stock?.history, startYear),
            latestValue(data.stock?.history),
          ),
        },
        {
          key: "btc",
          label: "비트코인",
          value: grow(
            wage!,
            valueAt(btc, startYear),
            latestValue(btc),
          ),
        },
      ];
      return list;
    }

    return { wage, currentWage, entries: build() };
  }, [data, btc, startYear, maxYear, wageTable]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">노동시간 환산</CardTitle>
        <p className="text-muted-foreground text-sm">
          {startYear}년 최저임금 <b>1시간</b>어치를 저축했다면, 오늘 그 돈으로
          몇 시간어치를 살 수 있을까요? (오늘 최저임금{" "}
          {r.currentWage != null ? money(r.currentWage) : "—"} 기준)
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <SliderRow
          label="시작 연도"
          valueLabel={`${startYear}년 · 시급 ${r.wage != null ? money(r.wage) : "—"}`}
          min={minYear}
          max={maxYear}
          step={1}
          value={startYear}
          onChange={setStartYear}
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {r.entries.map((e) =>
            e.value == null || r.currentWage == null ? (
              <EmptyCard
                key={e.key}
                label={e.label}
                note={`${startYear}년 데이터 없음`}
              />
            ) : (
              <StatCard
                key={e.key}
                label={e.label}
                value={e.value / r.currentWage}
                format={fmtHours}
                accent={e.key !== "deposit"}
                tone={
                  e.key === "deposit" && e.value / r.currentWage < 1
                    ? "bad"
                    : undefined
                }
                sub={money(e.value)}
              />
            ),
          )}
        </div>
        <p className="text-muted-foreground text-xs">
          1시간 미만이면 같은 노동의 구매력이 그만큼 줄어든 것입니다. 예금이
          최저임금 인상 속도를 따라가지 못하면 1시간 아래로 내려갑니다.
        </p>
      </CardContent>
    </Card>
  );
}
