"use client";

import { AppHeader } from "@/components/app-header";
import { MacroChart, MacroChartSkeleton } from "@/components/macro-chart";
import { PageMain } from "@/components/page-main";
import { Card, CardContent } from "@/components/ui/card";
import { useEconomy, useFred } from "@/hooks/use-economy";
import { useRelativeTime } from "@/hooks/use-relative-time";

export default function EconomyPage() {
  const { data: eco, isLoading: ecoLoading } = useEconomy();
  const { data: fred, isLoading: fredLoading } = useFred();

  const ecoRelTime = useRelativeTime(eco?.fetchedAt);
  const fredRelTime = useRelativeTime(fred?.fetchedAt);

  return (
    <>
      <AppHeader breadcrumbs={[{ label: "경제 지표" }]} />
      <PageMain>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-end">
            {ecoRelTime && (
              <span className="text-muted-foreground text-xs">{ecoRelTime}</span>
            )}
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
              />
              <MacroChart
                title="VIX 변동성지수"
                currentLabel={eco.vix.current?.toFixed(2) ?? "–"}
                changePercent={eco.vix.changePercent}
                lines={[{ data: eco.vix.history, color: "#ef4444" }]}
              />
            </>
          )}

          <div className="mt-3 flex items-center justify-between">
            <h2 className="text-muted-foreground text-sm font-semibold">
              통화·금리 (FRED)
            </h2>
            {fredRelTime && fred?.available && (
              <span className="text-muted-foreground text-xs">
                {fredRelTime}
              </span>
            )}
          </div>

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
                />
              )}
            </>
          )}
        </div>
      </PageMain>
    </>
  );
}
