"use client";

import { AppHeader } from "@/components/app-header";
import { PageMain } from "@/components/page-main";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AdoptionCascade } from "./adoption-cascade";
import { AttackGame } from "./attack-game";
import { HodlDilemma } from "./hodl-dilemma";
import { PayoffMatrix } from "./payoff-matrix";

const TABS = [
  { value: "payoff", label: "보수 행렬", node: <PayoffMatrix /> },
  { value: "cascade", label: "채택 캐스케이드", node: <AdoptionCascade /> },
  { value: "hodl", label: "홀더 딜레마", node: <HodlDilemma /> },
  { value: "attack", label: "51% 공격", node: <AttackGame /> },
];

export function BitcoinGameTheoryView() {
  return (
    <>
      <AppHeader breadcrumbs={[{ label: "비트코인 게임이론" }]} />
      <PageMain>
        <div className="mx-auto flex max-w-5xl flex-col gap-4">
          <div>
            <h1 className="text-xl font-semibold">
              비트코인을 움직이는 게임이론
            </h1>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              비트코인의 가격과 보안은 수많은 행위자(개인·기업·국가·채굴자)가 서로의
              선택을 의식하며 내리는 결정의 결과다. 각자가 합리적으로 행동할 때
              어떤 균형으로 수렴하는지를, 네 가지 게임으로 직접 돌려 보자.
            </p>
          </div>

          <Card className="gap-1.5 p-4 text-sm leading-relaxed">
            <span className="font-semibold">게임이론 한 줄 정리</span>
            <ul className="text-muted-foreground list-disc space-y-1 pl-4">
              <li>
                <b>행위자·전략·보수</b> — 누가, 어떤 선택을, 어떤 대가를 두고 하는가.
              </li>
              <li>
                <b>우월전략</b> — 상대가 무엇을 하든 나에게 더 유리한 전략.
              </li>
              <li>
                <b>내쉬 균형</b> — 아무도 혼자 전략을 바꿀 이유가 없는 안정 상태.
              </li>
            </ul>
          </Card>

          <Tabs defaultValue="payoff" className="gap-4">
            <TabsList className="w-full">
              {TABS.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {TABS.map((t) => (
              <TabsContent key={t.value} value={t.value}>
                {t.node}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </PageMain>
    </>
  );
}
