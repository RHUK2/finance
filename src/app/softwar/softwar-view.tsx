"use client";

import { AppHeader } from "@/components/app-header";
import { PageMain } from "@/components/page-main";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AbstractVsPhysical } from "./abstract-vs-physical";
import { PrimordialEconomics } from "./primordial-economics";
import { SoftwarVsHardwar } from "./softwar-vs-hardwar";

const TABS = [
  { value: "capture", label: "추상 vs 물리", node: <AbstractVsPhysical /> },
  { value: "nature", label: "자연의 파워 프로젝션", node: <PrimordialEconomics /> },
  { value: "deter", label: "소프트워 vs 하드워", node: <SoftwarVsHardwar /> },
];

export function SoftwarView() {
  return (
    <>
      <AppHeader breadcrumbs={[{ label: "비트코인 소프트워" }]} />
      <PageMain>
        <div className="mx-auto flex max-w-5xl flex-col gap-4">
          <div>
            <h1 className="text-xl font-semibold">
              비트코인 소프트워 — 파워 프로젝션
            </h1>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              제이슨 로워리(Jason Lowery)의 <i>Softwar</i>는 비트코인을 화폐가 아닌
              &lsquo;권력 투사 수단&rsquo;으로 본다. 자연에서 생물이 물리력을
              투사해 자원을 지키듯, 비트코인은 작업증명으로 와트를 부과해 디지털
              자산을 지킨다. 추상 권력의 약점을 물리적 비용으로 메우는 이 발상을 세
              가지 시뮬레이션으로 직접 돌려 보자.
            </p>
          </div>

          <Card className="gap-1.5 p-4 text-sm leading-relaxed">
            <span className="font-semibold">소프트워 한 줄 정리</span>
            <ul className="text-muted-foreground list-disc space-y-1 pl-4">
              <li>
                <b>물리 권력</b> — 실제 와트를 소비해 부과하는, 기만으로 뺏을 수
                없는 권력.
              </li>
              <li>
                <b>BCRA</b> — 공격 이득 ÷ 공격 비용. 1 미만으로 낮추면 공격이
                비합리가 된다.
              </li>
              <li>
                <b>소프트워</b> — 유혈 없이 전기로 권력을 투사하는 부드러운 전쟁.
              </li>
            </ul>
          </Card>

          <Tabs defaultValue="capture" className="gap-4">
            <TabsList className="grid w-full grid-cols-2 group-data-horizontal/tabs:h-auto">
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
