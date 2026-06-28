"use client";

import { AppHeader } from "@/components/app-header";
import { PageMain } from "@/components/page-main";
import { Card } from "@/components/ui/card";
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
              비트코인은 왜 이렇게 심하게 출렁일까? 시장은 매일 &lsquo;비트코인이 결국
              진짜 화폐로 자리 잡을까&rsquo;를 두고 성공 확률을 새로 매긴다. 그 확률이
              조금만 바뀌어도 가격은 크게 움직인다. 즉 변동성은 결함이 아니라, 이 질문에
              대한 시장의 답이 실시간으로 흔들리는 모습이다. 아래 세 가지 시뮬레이션으로
              직접 확인해 보자.
            </p>
          </div>

          <Card className="gap-1.5 p-4 text-sm leading-relaxed">
            <span className="font-semibold">한 줄 정리</span>
            <ul className="text-muted-foreground list-disc space-y-1 pl-4">
              <li>
                <b>두 갈래 운명</b> — 비트코인의 미래는 진짜 화폐로 자리 잡거나(성공) 0이
                되거나(실패) 둘 중 하나. 그래서 가격 ≈ 성공 확률 × 성공했을 때 가격.
              </li>
              <li>
                <b>변동성의 정체</b> — 성공 확률이 낮을 땐 같은 뉴스에도 가격이 몇 배로
                출렁이고, 확률이 높아질수록 덜 흔들린다.
              </li>
              <li>
                <b>성숙 수렴</b> — 성공·실패가 점점 분명해질수록(채택이 무르익을수록)
                변동성은 저절로 줄어든다.
              </li>
            </ul>
          </Card>

          <SimTabs tabs={TABS} defaultValue="regime" />
        </div>
      </PageMain>
    </>
  );
}
