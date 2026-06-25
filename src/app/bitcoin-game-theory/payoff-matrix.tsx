"use client";

import { useMemo, useState } from "react";

import { Crown, Flag, TrendingUp } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { ControlSlider, ExplainCard, SectionIntro } from "./components";
import { type Choice, payoffMatrix } from "./models";

const sign = (n: number) => (n > 0 ? `+${n.toFixed(1)}` : n.toFixed(1));

type CellKey = "AA" | "AW" | "WA" | "WW";

export function PayoffMatrix() {
  const [u, setU] = useState(6);
  const [r, setR] = useState(2);
  const [f, setF] = useState(4);

  const { cells, nash, dominantStrategy } = useMemo(
    () => payoffMatrix({ u, r, f }),
    [u, r, f],
  );

  const rows: { choice: Choice; label: string; keys: [CellKey, CellKey] }[] = [
    { choice: "A", label: "채택", keys: ["AA", "AW"] },
    { choice: "W", label: "관망", keys: ["WA", "WW"] },
  ];

  return (
    <div className="flex flex-col gap-4">
      <SectionIntro title="보수 행렬 — 사면 이득, 안 사면 낙오">
        두 행위자(우리나라 vs 경쟁국)가 비트코인을 <b>채택</b>할지 <b>관망</b>할지
        고른다. 슬라이더로 보수를 조정해 보자. 상승 기대와 낙오 페널티가 조기채택
        비용을 넘어서면 <b>채택이 우월전략</b>이 되어, 상대가 무엇을 하든 채택이
        유리해진다. 결국 내쉬 균형은 모두가 채택하는 칸으로 수렴한다. (수치는 개념용
        예시)
      </SectionIntro>

      <Card className="gap-4 p-4">
        <ControlSlider
          icon={<TrendingUp className="size-4 text-amber-500" />}
          label="상승 기대 (u)"
          value={u}
          onChange={setU}
          max={10}
          step={0.5}
          format={(v) => v.toFixed(1)}
        />
        <ControlSlider
          label="조기채택 비용·리스크 (r)"
          value={r}
          onChange={setR}
          max={10}
          step={0.5}
          format={(v) => v.toFixed(1)}
        />
        <ControlSlider
          label="낙오 페널티 (f)"
          value={f}
          onChange={setF}
          max={10}
          step={0.5}
          format={(v) => v.toFixed(1)}
        />
      </Card>

      <Card className="gap-3 p-4">
        <div className="grid grid-cols-[auto_1fr_1fr] gap-2 text-sm">
          {/* 헤더 */}
          <div />
          <ColHeader icon={<Flag className="size-4" />} label="경쟁국: 채택" />
          <ColHeader label="경쟁국: 관망" />

          {rows.map((row) => (
            <RowGroup key={row.choice} row={row} cells={cells} nash={nash} />
          ))}
        </div>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm ring-2 ring-amber-500/70" />
            내쉬 균형 (아무도 일방적으로 바꿀 이유가 없는 칸)
          </span>
          <span>칸 안의 값 = (우리 보수 / 경쟁국 보수)</span>
        </div>
      </Card>

      <Card className="flex-row items-center gap-3 p-4">
        <Crown
          className={cn(
            "size-5 shrink-0",
            dominantStrategy === "A"
              ? "text-amber-500"
              : "text-muted-foreground",
          )}
        />
        <p className="text-sm">
          {dominantStrategy === "A" ? (
            <>
              <b className="text-amber-600 dark:text-amber-400">채택이 우월전략</b>{" "}
              — 경쟁국이 채택하든 관망하든 우리는 채택하는 편이 항상 낫다. 양쪽 다
              같은 결론에 이르러 <b>모두 채택</b>이 유일한 균형이 된다.
            </>
          ) : dominantStrategy === "W" ? (
            <>
              지금은 <b>관망이 우월전략</b> — 조기채택 비용(r)이 상승 기대와 낙오
              페널티를 압도한다. u를 키우거나 r을 낮춰 보자.
            </>
          ) : (
            <>두 전략의 보수가 같은 경계 상태다. 슬라이더를 조금 움직여 보자.</>
          )}
        </p>
      </Card>

      <ExplainCard
        title="'두 번째로 좋은 건 없다'"
        body="비트코인 채택은 흔히 죄수의 딜레마처럼 보이지만, 보상 구조가 비대칭이라 결과가 다르다. 남들이 살 때 나만 안 사면 자산 가치 상승에서 소외돼 상대적으로 가난해진다(낙오 페널티 f). 이 페널티 때문에 관망은 열등전략이 되고, 합리적 행위자라면 결국 채택을 택한다 — 이것이 한 국가의 채택이 다른 국가의 채택을 부르는 캐스케이드의 출발점이다."
      />
    </div>
  );
}

function ColHeader({ icon, label }: { icon?: React.ReactNode; label: string }) {
  return (
    <div className="text-muted-foreground flex items-center justify-center gap-1 rounded-md bg-muted/50 px-2 py-1.5 text-center text-xs font-medium">
      {icon}
      {label}
    </div>
  );
}

function RowGroup({
  row,
  cells,
  nash,
}: {
  row: { choice: Choice; label: string; keys: [CellKey, CellKey] };
  cells: Record<CellKey, [number, number]>;
  nash: CellKey;
}) {
  return (
    <>
      <div className="text-muted-foreground flex items-center justify-center gap-1 rounded-md bg-muted/50 px-2 text-center text-xs font-medium">
        {row.choice === "A" ? (
          <Flag className="size-4" />
        ) : null}
        우리: {row.label}
      </div>
      {row.keys.map((k) => (
        <PayoffCell key={k} value={cells[k]} isNash={k === nash} />
      ))}
    </>
  );
}

function PayoffCell({
  value,
  isNash,
}: {
  value: [number, number];
  isNash: boolean;
}) {
  const [me, them] = value;
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-md border p-3 transition-all",
        isNash
          ? "border-amber-500/60 bg-amber-500/10 ring-2 ring-amber-500/70"
          : "bg-background",
      )}
    >
      <span className="font-mono text-base font-semibold tabular-nums">
        <span className={me >= 0 ? "" : "text-rose-500"}>{sign(me)}</span>
        <span className="text-muted-foreground"> / </span>
        <span className={them >= 0 ? "" : "text-rose-500"}>{sign(them)}</span>
      </span>
      {isNash && (
        <span className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
          내쉬 균형
        </span>
      )}
    </div>
  );
}
