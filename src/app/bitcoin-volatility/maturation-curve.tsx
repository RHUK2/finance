"use client";

import { useMemo } from "react";

import { LineSeries } from "lightweight-charts";

import { ChartContainer } from "@/components/chart-container";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useChart } from "@/hooks/use-chart";
import { useBitcoinHistorical } from "@/hooks/use-crypto";
import { rollingVolatility } from "@/lib/bitcoin-models";
import { ExplainCard, SectionIntro } from "@/components/simulation";

const WINDOW = 90;

export function MaturationCurve() {
  const { data } = useBitcoinHistorical();

  const vol = useMemo(() => {
    if (!data) return [];
    return rollingVolatility(data.history, WINDOW);
  }, [data]);

  const { containerRef, resetView } = useChart(
    (chart) => {
      const series = chart.addSeries(LineSeries, {
        color: "#f59e0b",
        lineWidth: 2,
        priceLineVisible: false,
      });
      series.setData(vol);
    },
    [vol],
    { height: 300, timeVisible: true },
  );

  const current = vol[vol.length - 1]?.value;

  return (
    <div className="flex flex-col gap-4">
      <SectionIntro title="성숙 곡선 — 실제 변동성은 추세적으로 하락한다">
        지금까지의 이야기가 맞다면, 비트코인이 자산으로 자리를 잡아갈수록 변동성은 점점
        줄어야 한다. 실제로 2015년부터 비트코인의 변동성(90일 기준, 연 단위로 환산)을
        그려 보면, 초기에 100%를 훌쩍 넘던 변동성이 사이클을 거듭할수록 한 단계씩
        낮아진다.
      </SectionIntro>

      <Card className="gap-3 p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium">변동성 (90일 기준, 연 환산)</span>
          {current != null && (
            <span className="font-mono text-lg font-semibold tabular-nums text-amber-600 dark:text-amber-400">
              {current.toFixed(0)}%
            </span>
          )}
        </div>
        {!data ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <ChartContainer containerRef={containerRef} onReset={resetView} />
        )}
      </Card>

      <ExplainCard
        title="이야기와 데이터가 만나는 지점"
        body="변동성이 추세적으로 낮아진다는 건, 비트코인이 점점 더 결과가 정해진 자산으로 받아들여지고 있다는 신호다. 덩치가 커져서 같은 돈으로는 가격을 예전만큼 흔들지 못하게 되고, 성공할 거라는 믿음이 단단해질수록 시장이 흔들릴 이유도 줄어든다. 언젠가 성공이든 실패든 결론이 확실해지는 날, 비트코인의 변동성도 보통 자산 수준으로 가라앉을 것이다."
      />
    </div>
  );
}
