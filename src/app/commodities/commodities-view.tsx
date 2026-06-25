"use client";

import { AppHeader } from "@/components/app-header";
import { MacroChart } from "@/components/macro-chart";
import { PageMain } from "@/components/page-main";
import { Button } from "@/components/ui/button";
import { useCommodities } from "@/hooks/use-commodities";
import { useRelativeTime } from "@/hooks/use-relative-time";
import { RotateCcw } from "lucide-react";
import { useRef } from "react";

export function CommoditiesView() {
  const { data } = useCommodities();

  const goldReset = useRef<(() => void) | null>(null);
  const oilReset = useRef<(() => void) | null>(null);
  const cornReset = useRef<(() => void) | null>(null);

  function resetAll() {
    goldReset.current?.();
    oilReset.current?.();
    cornReset.current?.();
  }

  const relTime = useRelativeTime(data?.fetchedAt);

  return (
    <>
      <AppHeader breadcrumbs={[{ label: "원자재 시장" }]} />
      <PageMain>
        <div className="flex flex-col gap-3">
          <div className="flex items-center">
            <Button variant="outline" size="sm" onClick={resetAll}>
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="text-xs">전체 스케일 초기화</span>
            </Button>
          </div>
          <MacroChart
            title="금 (Gold)"
            currentLabel={
              data?.gold.current != null
                ? `$${data.gold.current.toFixed(2)}`
                : "–"
            }
            changePercent={data?.gold.changePercent ?? null}
            lines={
              data ? [{ data: data.gold.history, color: "#f59e0b" }] : undefined
            }
            updatedLabel={relTime ?? undefined}
            resetRef={goldReset}
            description="금 선물(COMEX), 대표적 안전자산. 상승은 달러 약세·인플레이션·지정학 불안 또는 실질금리 하락을, 하락은 위험선호 회복이나 실질금리 상승을 반영하는 경향이 있습니다."
          />
          <MacroChart
            title="원유"
            currentLabel={
              data?.wti.current != null
                ? `$${data.wti.current.toFixed(2)}`
                : "–"
            }
            changePercent={data?.wti.changePercent ?? null}
            lines={
              data
                ? [
                    { label: "WTI", data: data.wti.history, color: "#6366f1" },
                    {
                      label: "브렌트",
                      data: data.brent.history,
                      color: "#ec4899",
                    },
                  ]
                : undefined
            }
            updatedLabel={relTime ?? undefined}
            resetRef={oilReset}
            description="WTI(미국 기준)·브렌트(국제 기준) 원유 선물 가격. 상승은 수요 강세(경기 호조)나 공급 차질로 인플레 압력을 키우고, 하락은 수요 둔화(경기 위축)나 공급 과잉을 시사하는 경향이 있습니다."
          />
          <MacroChart
            title="옥수수 (Corn)"
            currentLabel={
              data?.corn.current != null
                ? `$${data.corn.current.toFixed(2)}`
                : "–"
            }
            changePercent={data?.corn.changePercent ?? null}
            lines={
              data ? [{ data: data.corn.history, color: "#84cc16" }] : undefined
            }
            updatedLabel={relTime ?? undefined}
            resetRef={cornReset}
            description="옥수수 선물(CBOT), 식품·바이오에탄올의 핵심 원자재. 상승은 기상 악화·작황 부진이나 에너지 가격 상승에 따른 식량 인플레 압력을, 하락은 공급 안정을 시사하는 경향이 있습니다."
          />
        </div>
      </PageMain>
    </>
  );
}
