"use client";

import { useMemo, useState } from "react";

import { Crown, ShieldCheck, Zap } from "lucide-react";

import { Card } from "@/components/ui/card";
import {
  ControlSlider,
  ExplainCard,
  Metric,
  SectionIntro,
} from "@/components/simulation";
import { cn, formatUsd } from "@/lib/utils";

import { powerCapture } from "./models";

function bcraLabel(b: number) {
  return b >= 10 ? `${Math.round(b)}배` : `${b.toFixed(1)}배`;
}

export function AbstractVsPhysical() {
  const [value, setValue] = useState(1e9);
  const [abstractDefense, setAbstractDefense] = useState(5e6);
  const [physicalWall, setPhysicalWall] = useState(2e9);

  const r = useMemo(
    () => powerCapture({ value, abstractDefense, physicalWall }),
    [value, abstractDefense, physicalWall],
  );

  return (
    <div className="flex flex-col gap-4">
      <SectionIntro title="추상 권력 vs 물리 권력 — 약탈자는 어디를 노리는가">
        권력에는 두 종류가 있다. <b>추상 권력</b>은 위계·신뢰·직위처럼 믿음 위에
        세워져 휘두르긴 싸지만, 약탈자(belligerent actor)가 적은 비용으로 탈취할
        수 있다. <b>물리 권력</b>은 실제 와트를 소비해 부과하는 비용이라 비싸지만,
        자산 가치보다 더 많은 에너지를 쏟아야만 뺏을 수 있게 만든다. 합리적
        약탈자는 탈취 이득이 비용보다 클 때만 공격한다. (수치는 개념용 예시)
      </SectionIntro>

      <Card className="gap-4 p-4">
        <ControlSlider
          label="자원 가치"
          hint="약탈자가 탈취해 얻는 이득. 클수록 매력적인 표적이 된다."
          value={value}
          onChange={setValue}
          min={1e6}
          max={1e12}
          step={1e6}
          format={formatUsd}
        />
        <ControlSlider
          icon={<Crown className="size-4 text-rose-500" />}
          label="추상 권력 탈취 비용"
          hint="위계·신뢰를 매수·기만·강압해 장악하는 비용. 자산 가치에 비례하지 않고 낮게 고정된다."
          value={abstractDefense}
          onChange={setAbstractDefense}
          min={1e4}
          max={5e7}
          step={1e4}
          format={formatUsd}
        />
        <ControlSlider
          icon={<Zap className="size-4 text-amber-500" />}
          label="물리 권력 벽 (부과한 와트)"
          hint="탈취하려면 쏟아야 하는 실제 에너지 비용. 자산 가치 위로 올리면 공격이 비합리가 된다."
          value={physicalWall}
          onChange={setPhysicalWall}
          min={1e6}
          max={2e12}
          step={1e6}
          format={formatUsd}
        />
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <RegimeCard
          title="추상 권력"
          icon={<Crown className="size-4 text-rose-500" />}
          value={value}
          cost={r.abstract.cost}
          bcra={r.abstract.bcra}
          captured={r.abstract.captured}
        />
        <RegimeCard
          title="물리 권력"
          icon={<Zap className="size-4 text-amber-500" />}
          value={value}
          cost={r.physical.cost}
          bcra={r.physical.bcra}
          captured={r.physical.captured}
        />
      </div>

      <Card
        className={cn(
          "flex-row items-start gap-3 p-4",
          r.physical.captured
            ? "border-rose-500/40 bg-rose-500/5"
            : "border-emerald-500/40 bg-emerald-500/5",
        )}
      >
        <ShieldCheck
          className={cn(
            "size-5 shrink-0",
            r.physical.captured ? "text-rose-500" : "text-emerald-500",
          )}
        />
        <p className="text-sm leading-relaxed">
          추상 권력의 탈취 비용은 자산 가치가 아무리 커져도 함께 오르지 않는다.
          그래서 고가치 자산일수록 BCRA가 치솟아 <b>늘 탈취에 노출</b>된다. 반면
          물리 권력은 와트를 부과해 탈취 비용을 자산 가치 위로 끌어올릴 수 있다.{" "}
          {r.physical.captured ? (
            <>
              지금은 물리 권력 벽이 자원 가치보다 낮아 여전히 탈취된다. 벽을 가치
              위로 올려 보면 BCRA가 1 미만으로 떨어진다.
            </>
          ) : (
            <>
              지금은 물리 권력 벽이 자원 가치를 넘어 BCRA가 1 미만 — 합리적
              약탈자라면 공격을 포기한다. 이것이 소프트워가 말하는 탈취 불가능성이다.
            </>
          )}
        </p>
      </Card>

      <ExplainCard
        title="왜 비트코인은 물리 권력인가"
        body="명목 화폐·중앙화 시스템의 통제권은 추상 권력이라, 권한을 쥔 소수를 포섭하면 통째로 장악할 수 있다. 비트코인의 통제권은 작업증명으로 부과한 와트 위에 있어, 장악하려면 전 세계 채굴 전력을 능가하는 실제 에너지를 쏟아야 한다. 추상 권력의 약점을 물리적 비용으로 메우는 것이 소프트워의 핵심이다."
      />
    </div>
  );
}

function RegimeCard({
  title,
  icon,
  value,
  cost,
  bcra,
  captured,
}: {
  title: string;
  icon: React.ReactNode;
  value: number;
  cost: number;
  bcra: number;
  captured: boolean;
}) {
  const max = Math.max(value, cost);
  return (
    <Card className="gap-3 p-4">
      <span className="flex items-center gap-1.5 text-sm font-semibold">
        {icon}
        {title}
      </span>
      <Bar label="탈취 이득 (자원 가치)" value={value} max={max} className="bg-amber-500" />
      <Bar label="탈취 비용" value={cost} max={max} className="bg-sky-500" />
      <div className="grid grid-cols-2 gap-3">
        <Metric label="BCRA (이득÷비용)" value={bcraLabel(bcra)} tone={captured ? "bad" : "good"} />
        <Metric
          label="판정"
          value={captured ? "탈취됨" : "방어됨"}
          tone={captured ? "bad" : "good"}
        />
      </div>
    </Card>
  );
}

function Bar({
  label,
  value,
  max,
  className,
}: {
  label: string;
  value: number;
  max: number;
  className: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tabular-nums">{formatUsd(value)}</span>
      </div>
      <div className="bg-muted h-5 w-full overflow-hidden rounded-md">
        <div
          className={cn("h-full rounded-md transition-all", className)}
          style={{ width: `${Math.max(1, pct)}%` }}
        />
      </div>
    </div>
  );
}
