"use client";

import { useMemo } from "react";

import { MacroChart, type MacroLine } from "@/components/macro-chart";
import type { InflationData } from "@/hooks/use-inflation";
import { latestValue, normalizeToBase } from "@/lib/inflation-models";

type Props = {
  data: InflationData;
  baseYear: number;
};

export function CpiM2GapChart({ data, baseYear }: Props) {
  const { lines, gapLabel } = useMemo(() => {
    const cpi = normalizeToBase(data.cpi?.history, baseYear);
    const m2 = normalizeToBase(data.m2?.history, baseYear);
    const lines: MacroLine[] = [];
    if (cpi.length) lines.push({ label: "CPI", data: cpi, color: "#22c55e" });
    if (m2.length) lines.push({ label: "M2", data: m2, color: "#ef4444" });

    const cpiNow = latestValue(cpi);
    const m2Now = latestValue(m2);
    const gapLabel =
      cpiNow && m2Now
        ? `${baseYear}년=100 기준, CPI ${cpiNow.toFixed(0)} · M2 ${m2Now.toFixed(0)}`
        : undefined;

    return { lines: lines.length ? lines : undefined, gapLabel };
  }, [data, baseYear]);

  return (
    <MacroChart
      title="CPI vs M2 — 통화팽창과 물가의 괴리"
      currentLabel={gapLabel}
      lines={lines}
      description={`CPI는 소비재 바스켓 가격을, M2는 통화량을 측정합니다. ${baseYear}년을 100으로 맞추면 두 지표가 벌어지는 폭이 드러납니다. 그 격차의 상당 부분은 소비재 대신 자산(주택·주식)으로 흘러가 CPI에는 포착되지 않습니다.`}
    />
  );
}
