"use client";

import { useState } from "react";

import { Coins, TrendingUp } from "lucide-react";

import { Card } from "@/components/ui/card";
import {
  ControlSlider,
  ExplainCard,
  Metric,
  SectionIntro,
} from "@/components/simulation";
import { formatUsd } from "@/lib/utils";

import { regimeImpliedPrice } from "./models";

export function TwoRegime() {
  const [pPct, setPPct] = useState(15); // 성공 확률 %
  const [winCapT, setWinCapT] = useState(18); // 성공 시 목표 시총 $T

  const p = pPct / 100;
  const winCap = winCapT * 1e12;
  const { winPrice, implied } = regimeImpliedPrice(p, winCap);

  return (
    <div className="flex flex-col gap-4">
      <SectionIntro title="두 갈래 운명 — 가격은 곧 확률이다">
        비트코인의 미래 가치에는 어중간한 중간이 없다. 진짜 화폐로 자리 잡아 거대한
        시장을 차지하거나(성공), 그러지 못해 0에 가까워지거나(실패) 둘 중 하나다. 그래서
        오늘의 가격은 사실상 <b>성공 확률 × 성공했을 때의 가격</b>이다. 아래 슬라이더로
        성공 확률을 직접 움직여 보자.
      </SectionIntro>

      <Card className="gap-4 p-4">
        <ControlSlider
          icon={<TrendingUp className="size-4 text-amber-500" />}
          label="체제 전환 성공 확률 (p)"
          hint="시장이 '비트코인이 끝내 진짜 화폐가 된다'고 믿는 정도. 이 한 숫자가 가격을 좌우한다."
          value={pPct}
          onChange={setPPct}
          min={0}
          max={100}
          format={(v) => `${v}%`}
        />
        <ControlSlider
          icon={<Coins className="size-4 text-amber-500" />}
          label="성공 시 시장 규모"
          hint="성공했을 때 비트코인이 차지할 시장의 크기."
          value={winCapT}
          onChange={setWinCapT}
          min={1}
          max={50}
          format={(v) => `$${v}T`}
        />
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric
          label="성공 시 가격"
          value={formatUsd(winPrice)}
          tone="good"
          sub={`${formatUsd(winCap)} ÷ 2,100만 개`}
        />
        <Metric label="실패 시 가격" value="$0" tone="bad" sub="성공하지 못하면" />
        <Metric
          label="현재 함의 가격"
          value={formatUsd(implied)}
          tone="accent"
          sub={`성공 확률 ${pPct}% 반영`}
        />
      </div>

      <RegimeLine p={p} />

      <ExplainCard
        title="왜 작은 확률 변화에 가격이 크게 뛸까"
        body="성공했을 때의 가격이 수십만 달러로 워낙 크기 때문에, 성공 확률이 10%에서 15%로 조금만 올라도 가격은 단숨에 50% 뛴다. 비트코인에 '적정가의 기준'이 없는 게 아니라, 그 기준이 '성공 확률이 결국 100%로 굳어질 것인가'라는 아직 풀리지 않은 질문에 묶여 있는 것이다. 슬라이더를 조금씩만 움직여 봐도 가격이 얼마나 민감하게 반응하는지 알 수 있다."
      />
    </div>
  );
}

// 함의 가격 = p × 성공가 는 p에 대한 직선. 현재 p 위치를 점으로 표시.
function RegimeLine({ p }: { p: number }) {
  const W = 100;
  const H = 48;
  return (
    <Card className="gap-2 p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">가격 = 성공 확률 × 성공가</span>
        <span className="text-muted-foreground text-xs">
          x축: 성공 확률 0 → 100%
        </span>
      </div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="h-16 w-full"
        >
          <line
            x1="0"
            y1={H}
            x2={W}
            y2="0"
            stroke="currentColor"
            strokeWidth={1.5}
            className="text-amber-500"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={p * W}
            y1="0"
            x2={p * W}
            y2={H}
            stroke="currentColor"
            strokeWidth={1}
            strokeDasharray="3 3"
            className="text-muted-foreground"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div
          className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-amber-500"
          style={{ left: `${p * 100}%`, top: `${(1 - p) * 100}%` }}
        />
      </div>
    </Card>
  );
}
