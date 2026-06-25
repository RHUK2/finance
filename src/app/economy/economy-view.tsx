"use client";

import { AppHeader } from "@/components/app-header";
import { MacroChart } from "@/components/macro-chart";
import { PageMain } from "@/components/page-main";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEconomy, useFred } from "@/hooks/use-economy";
import { useRelativeTime } from "@/hooks/use-relative-time";
import { RotateCcw } from "lucide-react";
import { useMemo, useRef, type ReactNode } from "react";

/** FRED 데이터가 필요한 차트. 키가 없어 데이터를 못 받으면 안내 카드로 대체한다. */
function FredGate({
  available,
  title,
  children,
}: {
  available: boolean;
  title: string;
  children: ReactNode;
}) {
  if (available) return children;
  return (
    <Card>
      <CardContent className="text-muted-foreground text-sm">
        {title} · <code className="text-foreground">FRED_API_KEY</code>{" "}
        환경변수를 설정하면 표시됩니다.
      </CardContent>
    </Card>
  );
}

export function EconomyView() {
  const { data: eco } = useEconomy();
  const { data: fred } = useFred();

  // 로딩 중(undefined)에는 차트를 렌더해 스켈레톤을 보이고, 명시적으로 unavailable일 때만 대체한다.
  const fredAvailable = fred?.available !== false;

  const dxyReset = useRef<(() => void) | null>(null);
  const us10yReset = useRef<(() => void) | null>(null);
  const vixReset = useRef<(() => void) | null>(null);
  const fedFundsReset = useRef<(() => void) | null>(null);
  const nasdaqReset = useRef<(() => void) | null>(null);
  const kospiReset = useRef<(() => void) | null>(null);
  const usdkrwReset = useRef<(() => void) | null>(null);
  const yieldSpreadReset = useRef<(() => void) | null>(null);

  function resetAll() {
    dxyReset.current?.();
    us10yReset.current?.();
    vixReset.current?.();
    fedFundsReset.current?.();
    nasdaqReset.current?.();
    kospiReset.current?.();
    usdkrwReset.current?.();
    yieldSpreadReset.current?.();
  }

  const ecoRelTime = useRelativeTime(eco?.fetchedAt);
  const fredRelTime = useRelativeTime(fred?.fetchedAt);

  const yieldSpread = useMemo(() => {
    if (!eco || !fred?.us2y) return undefined;
    const us2yMap = new Map(fred.us2y.history.map((p) => [p.time, p.value]));
    const history = eco.us10y.history
      .filter((p) => us2yMap.has(p.time))
      .map((p) => ({
        time: p.time,
        value: Number((p.value - us2yMap.get(p.time)!).toFixed(2)),
      }));
    const last = history[history.length - 1];
    const prev = history[history.length - 2];
    const changePercent =
      last && prev && prev.value !== 0
        ? Number((((last.value - prev.value) / prev.value) * 100).toFixed(2))
        : null;
    return { history, current: last?.value ?? null, changePercent };
  }, [eco, fred]);

  return (
    <>
      <AppHeader breadcrumbs={[{ label: "경제 지표" }]} />
      <PageMain>
        <div className="flex flex-col gap-3">
          <div className="flex items-center">
            <Button variant="outline" size="sm" onClick={resetAll}>
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="text-xs">전체 스케일 초기화</span>
            </Button>
          </div>

          <MacroChart
            title="달러/원 (USD/KRW)"
            currentLabel={
              eco?.usdkrw.current != null
                ? `₩${eco.usdkrw.current.toLocaleString("ko-KR", { maximumFractionDigits: 0 })}`
                : "–"
            }
            changePercent={eco?.usdkrw.changePercent ?? null}
            lines={
              eco ? [{ data: eco.usdkrw.history, color: "#22c55e" }] : undefined
            }
            updatedLabel={ecoRelTime ?? undefined}
            resetRef={usdkrwReset}
            description="달러 대비 원화 환율. 상승(원화 약세)하면 수입 물가가 오르고 외국인 자금 유출 압력이 커지며, 하락(원화 강세)하면 수입 물가 안정·외국인 자금 유입 신호로 읽힙니다. 달러 강세(DXY) 국면에 동조해 오르는 경향이 있습니다."
          />

          <MacroChart
            title="달러인덱스"
            currentLabel={eco?.dxy.current?.toFixed(2) ?? "–"}
            changePercent={eco?.dxy.changePercent ?? null}
            lines={
              eco ? [{ data: eco.dxy.history, color: "#22c55e" }] : undefined
            }
            updatedLabel={ecoRelTime ?? undefined}
            resetRef={dxyReset}
            description="달러의 주요 6개 통화 대비 강세를 나타내는 지수. 상승하면 신흥국 자산·원자재·비트코인 등 위험자산에서 자금 유출 압력이 커지고, 하락하면 위험자산·원자재로 유동성이 유입되는 경향이 있습니다."
          />

          <MacroChart
            title="코스피"
            currentLabel={
              eco?.kospi.current != null
                ? eco.kospi.current.toLocaleString("ko-KR", {
                    maximumFractionDigits: 2,
                  })
                : "–"
            }
            changePercent={eco?.kospi.changePercent ?? null}
            lines={
              eco ? [{ data: eco.kospi.history, color: "#a78bfa" }] : undefined
            }
            updatedLabel={ecoRelTime ?? undefined}
            resetRef={kospiReset}
            description="한국 증시 대표 지수. 수출 대형주(반도체·자동차) 비중이 높아 상승은 글로벌 경기 호조·위험선호를, 하락은 경기 둔화나 원화 약세 우려를 반영하는 경향이 있습니다."
          />

          <MacroChart
            title="나스닥"
            currentLabel={
              eco?.nasdaq.current != null
                ? eco.nasdaq.current.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })
                : "–"
            }
            changePercent={eco?.nasdaq.changePercent ?? null}
            lines={
              eco ? [{ data: eco.nasdaq.history, color: "#38bdf8" }] : undefined
            }
            updatedLabel={ecoRelTime ?? undefined}
            resetRef={nasdaqReset}
            description="미국 기술주 중심의 나스닥 종합지수. 상승은 위험선호 확대와 풍부한 유동성(완화 기대)을, 하락은 긴축·경기 우려에 따른 위험회피를 반영하는 경향이 있습니다."
          />

          <MacroChart
            title="VIX 변동성지수"
            currentLabel={eco?.vix.current?.toFixed(2) ?? "–"}
            changePercent={eco?.vix.changePercent ?? null}
            lines={
              eco ? [{ data: eco.vix.history, color: "#ef4444" }] : undefined
            }
            updatedLabel={ecoRelTime ?? undefined}
            resetRef={vixReset}
            description="S&P 500 옵션 시장이 예상하는 30일 변동성, '공포지수'. 상승할수록 시장 불안이 커지며(20 이상 불안, 30 이상 극도의 공포), 낮게 유지되면 시장이 안정·낙관 국면임을 뜻합니다."
          />

          <FredGate available={fredAvailable} title="연준 기준금리">
            <MacroChart
              title="연준 기준금리"
              currentLabel={
                fred?.fedFunds?.current != null
                  ? `${fred.fedFunds.current.toFixed(2)}%`
                  : "–"
              }
              changePercent={fred?.fedFunds?.changePercent ?? null}
              lines={
                fred?.fedFunds
                  ? [{ data: fred.fedFunds.history, color: "#06b6d4" }]
                  : undefined
              }
              updatedLabel={fredRelTime ?? undefined}
              resetRef={fedFundsReset}
              description="연방준비제도가 설정하는 단기 금리 목표. 인상은 긴축 국면으로 유동성을 죄어 위험자산에 불리하고, 인하는 완화 신호로 유동성 공급 기대를 높여 위험자산에 우호적입니다."
            />
          </FredGate>

          <MacroChart
            title="미국 국채금리"
            currentLabel={
              eco?.us10y.current != null
                ? `${eco.us10y.current.toFixed(2)}%`
                : "–"
            }
            changePercent={eco?.us10y.changePercent ?? null}
            lines={
              eco && fred?.us2y
                ? [
                    { label: "2Y", data: fred.us2y.history, color: "#22c55e" },
                    { label: "10Y", data: eco.us10y.history, color: "#3b82f6" },
                    { label: "30Y", data: eco.us30y.history, color: "#a78bfa" },
                  ]
                : eco
                  ? [
                      {
                        label: "10Y",
                        data: eco.us10y.history,
                        color: "#3b82f6",
                      },
                      {
                        label: "30Y",
                        data: eco.us30y.history,
                        color: "#a78bfa",
                      },
                    ]
                  : undefined
            }
            updatedLabel={ecoRelTime ?? undefined}
            resetRef={us10yReset}
            description="미국 장기 국채의 수익률. 상승하면 무위험 수익률이 올라 주식·비트코인 등 위험자산의 상대 매력이 낮아지고, 하락은 경기 침체 우려 또는 완화 기대 신호로 해석됩니다."
          />

          <FredGate
            available={fredAvailable}
            title="수익률 곡선 스프레드 (10Y–2Y)"
          >
            <MacroChart
              title="수익률 곡선 스프레드 (10Y–2Y)"
              currentLabel={
                yieldSpread?.current != null
                  ? `${yieldSpread.current.toFixed(2)}%p`
                  : "–"
              }
              changePercent={yieldSpread?.changePercent ?? null}
              lines={
                yieldSpread
                  ? [{ data: yieldSpread.history, color: "#f59e0b" }]
                  : undefined
              }
              updatedLabel={fredRelTime ?? undefined}
              resetRef={yieldSpreadReset}
              description="미국 10년물−2년물 국채 금리의 차이. 0 아래로 역전(하락)되면 역사적으로 경기침체 선행 신호로, 다시 0 위로 상승(정상화)하면 침체 임박 또는 완화 사이클 진입 신호로 읽힙니다."
            />
          </FredGate>
        </div>
      </PageMain>
    </>
  );
}
