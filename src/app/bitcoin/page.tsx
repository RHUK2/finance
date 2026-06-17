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
import { useRelativeTime } from "@/hooks/use-relative-time";
import { RotateCcw } from "lucide-react";
import { useRef, useMemo } from "react";

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

  // 가장 오래 전에 캐시된 데이터의 fetchedAt 사용
  const oldestFetchedAt = useMemo(() => {
    const timestamps = [
      fearGreed?.fetchedAt,
      mvrv?.fetchedAt,
      historical?.fetchedAt,
    ].filter((t): t is string => Boolean(t));
    if (!timestamps.length) return undefined;
    return timestamps.reduce((oldest, t) => (t < oldest ? t : oldest));
  }, [fearGreed?.fetchedAt, mvrv?.fetchedAt, historical?.fetchedAt]);

  const relativeTime = useRelativeTime(oldestFetchedAt);

  return (
    <>
      <AppHeader breadcrumbs={[{ label: "비트코인 지표" }]} />
      <PageMain>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={resetAll}>
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="text-xs">전체 스케일 초기화</span>
            </Button>
            {relativeTime && (
              <span className="text-muted-foreground text-xs">
                {relativeTime}
              </span>
            )}
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
