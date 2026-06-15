"use client";

import { AppHeader } from "@/components/app-header";
import {
  FearGreedChart,
  FearGreedChartSkeleton,
} from "@/components/fear-greed-chart";
import { MvrvChart, MvrvChartSkeleton } from "@/components/mvrv-chart";
import { PageMain } from "@/components/page-main";
import {
  PowerLawChart,
  PowerLawChartSkeleton,
} from "@/components/power-law-chart";
import { RainbowChart, RainbowChartSkeleton } from "@/components/rainbow-chart";
import {
  StockToFlowChart,
  StockToFlowChartSkeleton,
} from "@/components/stock-to-flow-chart";
import { Button } from "@/components/ui/button";
import {
  useBitcoinHistorical,
  useFearGreed,
  useMvrv,
} from "@/hooks/use-crypto";
import { RotateCcw } from "lucide-react";
import { useRef } from "react";

export default function BitcoinPage() {
  const { data: fearGreed, isLoading: fearGreedLoading } = useFearGreed();
  const { data: mvrv, isLoading: mvrvLoading } = useMvrv();
  const { data: historical, isLoading: historicalLoading } =
    useBitcoinHistorical();

  const fearGreedReset = useRef<(() => void) | null>(null);
  const mvrvReset = useRef<(() => void) | null>(null);
  const rainbowReset = useRef<(() => void) | null>(null);
  const powerLawReset = useRef<(() => void) | null>(null);
  const stockToFlowReset = useRef<(() => void) | null>(null);

  function resetAll() {
    fearGreedReset.current?.();
    mvrvReset.current?.();
    rainbowReset.current?.();
    powerLawReset.current?.();
    stockToFlowReset.current?.();
  }

  return (
    <>
      <AppHeader
        breadcrumbs={[{ label: "비트코인 지표" }]}
      />
      <PageMain>
        <div className="flex flex-col gap-3">
          <div className="flex">
            <Button variant="outline" size="sm" onClick={resetAll}>
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="text-xs">전체 초기화</span>
            </Button>
          </div>
          {fearGreedLoading ? (
            <FearGreedChartSkeleton />
          ) : (
            fearGreed && (
              <FearGreedChart data={fearGreed} resetRef={fearGreedReset} />
            )
          )}
          {mvrvLoading ? (
            <MvrvChartSkeleton />
          ) : (
            mvrv && <MvrvChart data={mvrv} resetRef={mvrvReset} />
          )}
          {historicalLoading ? (
            <RainbowChartSkeleton />
          ) : (
            historical && (
              <RainbowChart data={historical} resetRef={rainbowReset} />
            )
          )}
          {historicalLoading ? (
            <PowerLawChartSkeleton />
          ) : (
            historical && (
              <PowerLawChart data={historical} resetRef={powerLawReset} />
            )
          )}
          {historicalLoading ? (
            <StockToFlowChartSkeleton />
          ) : (
            historical && (
              <StockToFlowChart data={historical} resetRef={stockToFlowReset} />
            )
          )}
        </div>
      </PageMain>
    </>
  );
}
