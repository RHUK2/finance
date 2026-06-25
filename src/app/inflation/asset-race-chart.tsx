"use client";

import { useMemo } from "react";
import { LineSeries } from "lightweight-charts";

import { ChartContainer } from "@/components/chart-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useChart } from "@/hooks/use-chart";
import type { InflationData } from "@/hooks/use-inflation";
import {
  depositIndex,
  normalizeToBase,
  type Point,
} from "@/lib/inflation-models";

type Line = { label: string; color: string; data: Point[] };

type Props = {
  data: InflationData;
  btc?: Point[];
  baseYear: number;
  stockLabel: string;
  updatedLabel?: string;
};

export function AssetRaceChart({
  data,
  btc,
  baseYear,
  stockLabel,
  updatedLabel,
}: Props) {
  const { lines, hasLateEntrant } = useMemo(() => {
    const out: Line[] = [];
    let hasLateEntrant = false;
    const dep = depositIndex(data.deposit?.history, baseYear);
    if (dep.length) out.push({ label: "예금", color: "#9ca3af", data: dep });

    const assets: { label: string; color: string; series?: Point[] }[] = [
      { label: stockLabel, color: "#3b82f6", series: data.stock?.history },
      { label: "주택", color: "#f59e0b", series: data.house?.history },
      { label: "비트코인", color: "#f7931a", series: btc },
    ];
    let hasAsset = false;
    for (const a of assets) {
      // 기준연도에 아직 없던 자산(예: 비트코인)은 등장 연도를 100으로 환산해 합류시킨다.
      const startYear = a.series?.[0] ? Number(a.series[0].time.slice(0, 4)) : 0;
      const effBase = Math.max(baseYear, startYear);
      const norm = normalizeToBase(a.series, effBase);
      if (norm.length) {
        out.push({ label: a.label, color: a.color, data: norm });
        hasAsset = true;
        if (effBase > baseYear) hasLateEntrant = true;
      }
    }

    // 위험자산 데이터가 없는 시장(예: 한국)에서는 통화팽창·물가를 기준선으로.
    if (!hasAsset) {
      const m2 = normalizeToBase(data.m2?.history, baseYear);
      if (m2.length)
        out.push({ label: "통화량(M2)", color: "#ef4444", data: m2 });
      const cpi = normalizeToBase(data.cpi?.history, baseYear);
      if (cpi.length)
        out.push({ label: "물가(CPI)", color: "#22c55e", data: cpi });
    }
    return { lines: out, hasLateEntrant };
  }, [data, btc, baseYear, stockLabel]);

  const { containerRef, resetView } = useChart(
    (chart) => {
      lines.forEach((line) => {
        const series = chart.addSeries(LineSeries, {
          color: line.color,
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: true,
          title: line.label,
        });
        series.setData(line.data);
      });
    },
    [lines],
    { height: 320, logScale: true },
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">예금 vs 자산 레이스</CardTitle>
          {updatedLabel && (
            <span className="text-muted-foreground text-xs">
              {updatedLabel}
            </span>
          )}
        </div>
        <p className="text-muted-foreground text-sm">
          {baseYear}년에 같은 금액을 각각 넣었다면, 시간에 따라 평가액이 어떻게
          갈라지는지 보여줍니다. (로그 스케일, 시작=100)
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <ChartContainer containerRef={containerRef} onReset={resetView} />
        <p className="bg-muted/50 text-muted-foreground px-6 pt-3 pb-4 text-xs">
          예금 곡선이 자산 곡선과 벌어지는 폭이 곧 기회비용입니다. 자산 수익률은
          배당·세금·거래비용을 제외한 가격 기준이며, 과거 성과가 미래를 보장하지
          않습니다.
          {hasLateEntrant &&
            " 비트코인은 기준연도에 존재하지 않아 등장 시점을 100으로 따로 환산했습니다(원화 환산)."}
        </p>
      </CardContent>
    </Card>
  );
}
