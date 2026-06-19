"use client";

import { AppHeader } from "@/components/app-header";
import { MacroChart, MacroChartSkeleton } from "@/components/macro-chart";
import { PageMain } from "@/components/page-main";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEconomy, useFred } from "@/hooks/use-economy";
import { useRelativeTime } from "@/hooks/use-relative-time";
import { RotateCcw } from "lucide-react";
import { useRef } from "react";

export default function EconomyPage() {
  const { data: eco, isLoading: ecoLoading, refetch: refetchEco, isFetching: ecoFetching } = useEconomy();
  const { data: fred, isLoading: fredLoading, refetch: refetchFred, isFetching: fredFetching } = useFred();

  const isFetching = ecoFetching || fredFetching;
  function refetchAll() {
    refetchEco();
    refetchFred();
  }

  const dxyReset = useRef<(() => void) | null>(null);
  const us10yReset = useRef<(() => void) | null>(null);
  const vixReset = useRef<(() => void) | null>(null);
  const m2Reset = useRef<(() => void) | null>(null);
  const fedFundsReset = useRef<(() => void) | null>(null);

  function resetAll() {
    dxyReset.current?.();
    us10yReset.current?.();
    vixReset.current?.();
    m2Reset.current?.();
    fedFundsReset.current?.();
  }

  const ecoRelTime = useRelativeTime(eco?.fetchedAt);
  const fredRelTime = useRelativeTime(fred?.fetchedAt);

  return (
    <>
      <AppHeader breadcrumbs={[{ label: "경제 지표" }]} />
      <PageMain onRefresh={refetchAll} isRefreshing={isFetching}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center">
            <Button variant="outline" size="sm" onClick={resetAll}>
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="text-xs">전체 스케일 초기화</span>
            </Button>
          </div>
          {ecoLoading || !eco ? (
            <>
              <MacroChartSkeleton />
              <MacroChartSkeleton />
              <MacroChartSkeleton />
            </>
          ) : (
            <>
              <MacroChart
                title="달러인덱스 (DXY)"
                currentLabel={eco.dxy.current?.toFixed(2) ?? "–"}
                changePercent={eco.dxy.changePercent}
                lines={[{ data: eco.dxy.history, color: "#22c55e" }]}
                updatedLabel={ecoRelTime ?? undefined}
                resetRef={dxyReset}
                description="달러의 주요 6개 통화 대비 강세를 나타내는 지수. 달러 강세는 신흥국 자산과 원자재에 부담을 주며, 비트코인 등 위험자산과 역의 상관관계를 보이는 경향이 있습니다."
              />
              <MacroChart
                title="미국 국채금리"
                currentLabel={
                  eco.us10y.current != null
                    ? `${eco.us10y.current.toFixed(2)}%`
                    : "–"
                }
                changePercent={eco.us10y.changePercent}
                lines={[
                  { label: "10Y", data: eco.us10y.history, color: "#3b82f6" },
                  { label: "30Y", data: eco.us30y.history, color: "#a78bfa" },
                ]}
                updatedLabel={ecoRelTime ?? undefined}
                resetRef={us10yReset}
                description="미국 장기 국채의 수익률. 금리 상승은 무위험 수익률 상승을 의미해 위험자산 매력을 낮추고, 하락 반전은 경기 침체 우려 또는 완화 신호로 해석됩니다."
              />
              <MacroChart
                title="VIX 변동성지수"
                currentLabel={eco.vix.current?.toFixed(2) ?? "–"}
                changePercent={eco.vix.changePercent}
                lines={[{ data: eco.vix.history, color: "#ef4444" }]}
                updatedLabel={ecoRelTime ?? undefined}
                resetRef={vixReset}
                description="S&P 500 옵션 시장이 예상하는 30일 변동성. '공포지수'라고도 불리며, 20 이상이면 시장 불안, 30 이상이면 극도의 공포 상태를 나타냅니다."
              />
            </>
          )}

          {fredLoading || !fred ? (
            <>
              <MacroChartSkeleton />
              <MacroChartSkeleton />
            </>
          ) : !fred.available ? (
            <Card>
              <CardContent className="text-muted-foreground text-sm">
                M2 통화량·연준 기준금리는 FRED API 키가 필요합니다.{" "}
                <code className="text-foreground">FRED_API_KEY</code> 환경변수를
                설정하면 표시됩니다.
              </CardContent>
            </Card>
          ) : (
            <>
              {fred.m2 && (
                <MacroChart
                  title="M2 통화량"
                  currentLabel={
                    fred.m2.current != null
                      ? `$${(fred.m2.current / 1000).toFixed(2)}T`
                      : "–"
                  }
                  changePercent={fred.m2.changePercent}
                  lines={[{ data: fred.m2.history, color: "#f59e0b" }]}
                  updatedLabel={fredRelTime ?? undefined}
                  resetRef={m2Reset}
                  description="유통 중인 현금·예금·단기 금융자산의 합계. M2 팽창은 시중 유동성 증가로 위험자산 상승 압력을 높이고, 수축은 긴축 국면 진입 신호로 해석됩니다."
                />
              )}
              {fred.fedFunds && (
                <MacroChart
                  title="연준 기준금리"
                  currentLabel={
                    fred.fedFunds.current != null
                      ? `${fred.fedFunds.current.toFixed(2)}%`
                      : "–"
                  }
                  changePercent={fred.fedFunds.changePercent}
                  lines={[{ data: fred.fedFunds.history, color: "#06b6d4" }]}
                  updatedLabel={fredRelTime ?? undefined}
                  resetRef={fedFundsReset}
                  description="연방준비제도가 설정하는 단기 금리 목표. 금리 인상은 긴축 국면으로 위험자산에 불리하고, 인하는 완화 신호로 유동성 공급 기대를 높입니다."
                />
              )}
            </>
          )}
        </div>
      </PageMain>
    </>
  );
}
