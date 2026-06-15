"use client";

import { AppHeader } from "@/components/app-header";
import { PageMain } from "@/components/page-main";
import {
  FearGreedChart,
  FearGreedChartSkeleton,
} from "@/components/fear-greed-chart";
import { MvrvChart, MvrvChartSkeleton } from "@/components/mvrv-chart";
import {
  PowerLawChart,
  PowerLawChartSkeleton,
} from "@/components/power-law-chart";
import { RainbowChart, RainbowChartSkeleton } from "@/components/rainbow-chart";
import {
  StockToFlowChart,
  StockToFlowChartSkeleton,
} from "@/components/stock-to-flow-chart";
import {
  useBitcoinHistorical,
  useFearGreed,
  useMvrv,
} from "@/hooks/use-crypto";

export default function BitcoinPage() {
  const { data: fearGreed, isLoading: fearGreedLoading } = useFearGreed();
  const { data: mvrv, isLoading: mvrvLoading } = useMvrv();
  const { data: historical, isLoading: historicalLoading } =
    useBitcoinHistorical();

  return (
    <>
      <AppHeader
        breadcrumbs={[{ label: "비트코인 지표" }]}
        updateCycle="24시간 갱신"
      />
      <PageMain>
        <div className="flex flex-col gap-3">
          {fearGreedLoading ? (
            <FearGreedChartSkeleton />
          ) : (
            fearGreed && <FearGreedChart data={fearGreed} />
          )}
          {mvrvLoading ? (
            <MvrvChartSkeleton />
          ) : (
            mvrv && <MvrvChart data={mvrv} />
          )}
          {historicalLoading ? (
            <RainbowChartSkeleton />
          ) : (
            historical && <RainbowChart data={historical} />
          )}
          {historicalLoading ? (
            <PowerLawChartSkeleton />
          ) : (
            historical && <PowerLawChart data={historical} />
          )}
          {historicalLoading ? (
            <StockToFlowChartSkeleton />
          ) : (
            historical && <StockToFlowChart data={historical} />
          )}
        </div>
      </PageMain>
    </>
  );
}
