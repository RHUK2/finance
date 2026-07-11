"use client";

import { AppHeader } from "@/components/app-header";
import { PageMain } from "@/components/page-main";
import { SimTabs } from "@/components/simulation";

import { MaturationCurve } from "./maturation-curve";
import { TwoRegime } from "./two-regime";
import { VolatilityEngine } from "./volatility-engine";

const TABS = [
  { value: "regime", label: "두 갈래 운명", node: <TwoRegime /> },
  { value: "engine", label: "변동성의 정체", node: <VolatilityEngine /> },
  { value: "maturation", label: "성숙 곡선", node: <MaturationCurve /> },
];

export function BitcoinVolatilityView() {
  return (
    <>
      <AppHeader breadcrumbs={[{ label: "비트코인 변동성" }]} />
      <PageMain>
        <div className="mx-auto flex max-w-5xl flex-col gap-4">
          <div>
            <h1 className="text-xl font-semibold">
              변동성 = 체제 전환 확률의 가격
            </h1>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              비트코인은 왜 이렇게 심하게 출렁일까? 시장은 매일 &#39;비트코인이 결국
              진짜 화폐로 자리 잡을까&#39;를 두고 성공 확률을 새로 매긴다. 그 확률이
              조금만 바뀌어도 가격은 크게 움직인다. 즉 변동성은 결함이 아니라, 이 질문에
              대한 시장의 답이 실시간으로 흔들리는 모습이다. 아래 세 가지 시뮬레이션으로
              직접 확인해 보자.
            </p>
          </div>

          <SimTabs tabs={TABS} defaultValue="regime" />
        </div>
      </PageMain>
    </>
  );
}
