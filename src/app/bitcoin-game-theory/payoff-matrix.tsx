"use client";

import { useMemo, useState } from "react";

import { AlertTriangle, Crown, Flag, TrendingUp, UserMinus } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { ControlSlider, ExplainCard, SectionIntro } from "./components";
import {
  type BestResponses,
  type CellKey,
  type PayoffCells,
  bestResponses,
  payoffMatrix,
  prisonersDilemma,
} from "./models";

// 죄수의 딜레마는 고정 상수라 모듈 레벨에서 한 번만 계산한다.
const PD = prisonersDilemma();
const PD_BEST = bestResponses(PD.cells);

const sign = (n: number) => (n > 0 ? `+${n.toFixed(1)}` : n.toFixed(1));

// 슬라이더별 색 스킴 — 산식·판정식·범례에서 동일하게 재사용한다.
const C = {
  u: "text-emerald-600 dark:text-emerald-400",
  r: "text-rose-600 dark:text-rose-400",
  f: "text-amber-600 dark:text-amber-400",
};

function Num({ color, children }: { color: string; children: React.ReactNode }) {
  return <span className={cn("font-semibold", color)}>{children}</span>;
}

type Header = { icon?: React.ReactNode; label: string };

export function PayoffMatrix() {
  const [u, setU] = useState(6);
  const [r, setR] = useState(2);
  const [f, setF] = useState(4);

  const { cells, nash, dominantStrategy, margin } = useMemo(
    () => payoffMatrix({ u, r, f }),
    [u, r, f],
  );
  const best = useMemo(() => bestResponses(cells), [cells]);

  // 칸별 보수 산식 (우리 기준). 슬라이더 색과 매칭해 어느 값이 어디서 왔는지 보이게.
  const formulas: Record<CellKey, React.ReactNode> = {
    AA: (
      <>
        <Num color={C.u}>{u}</Num>−<Num color={C.r}>{r}</Num>
      </>
    ),
    AW: (
      <>
        <Num color={C.u}>{u}</Num>−<Num color={C.r}>{r}</Num>+
        <Num color={C.f}>{f}</Num>
      </>
    ),
    WA: (
      <>
        −<Num color={C.f}>{f}</Num>
      </>
    ),
    WW: <>0</>,
  };


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
          icon={<TrendingUp className="size-4 text-emerald-500" />}
          label="상승 기대 (u)"
          value={u}
          onChange={setU}
          max={10}
          step={0.5}
          format={(v) => v.toFixed(1)}
        />
        <ControlSlider
          icon={<AlertTriangle className="size-4 text-rose-500" />}
          label="조기채택 비용·리스크 (r)"
          value={r}
          onChange={setR}
          max={10}
          step={0.5}
          format={(v) => v.toFixed(1)}
        />
        <ControlSlider
          icon={<UserMinus className="size-4 text-amber-500" />}
          label="낙오 페널티 (f)"
          value={f}
          onChange={setF}
          max={10}
          step={0.5}
          format={(v) => v.toFixed(1)}
        />
      </Card>

      <Card className="gap-3 p-4">
        <PayoffGrid
          cells={cells}
          best={best}
          nash={nash}
          formulas={formulas}
          rowHeaders={[
            { icon: <Flag className="size-4" />, label: "우리: 채택" },
            { label: "우리: 관망" },
          ]}
          colHeaders={[
            { icon: <Flag className="size-4" />, label: "경쟁국: 채택" },
            { label: "경쟁국: 관망" },
          ]}
        />
        <Legend />
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
        <div className="text-sm">
          <p>
            {dominantStrategy === "A" ? (
              <>
                <b className="text-amber-600 dark:text-amber-400">
                  채택이 우월전략
                </b>{" "}
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
          <p className="text-muted-foreground mt-1.5 font-mono text-xs">
            상승기대 − 비용 + 낙오페널티 = <Num color={C.u}>{u}</Num>−
            <Num color={C.r}>{r}</Num>+<Num color={C.f}>{f}</Num> ={" "}
            <span className="font-semibold text-foreground">{sign(margin)}</span>{" "}
            {margin > 0
              ? "> 0 → 채택 우월"
              : margin < 0
                ? "< 0 → 관망 우월"
                : "= 0 → 경계"}
          </p>
        </div>
      </Card>

      <Card className="gap-3 p-4">
        <div>
          <h3 className="font-semibold">비교 — 죄수의 딜레마</h3>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            같은 &lsquo;우월전략&rsquo; 구조라도 보상이 다르면 결과가 정반대가
            된다. 죄수의 딜레마에선 배신이 우월전략이라 둘 다 배신(1/1)으로
            수렴하지만, 이는 둘 다 협력(3/3)보다 <b>모두에게 더 나쁜</b> 결과다.
          </p>
        </div>
        <PayoffGrid
          cells={PD.cells}
          best={PD_BEST}
          nash={PD.nash}
          rowHeaders={[{ label: "우리: 협력" }, { label: "우리: 배신" }]}
          colHeaders={[{ label: "상대: 협력" }, { label: "상대: 배신" }]}
        />
      </Card>

      <ExplainCard
        title="'두 번째로 좋은 건 없다'"
        body="비트코인 채택은 흔히 죄수의 딜레마처럼 보이지만, 보상 구조가 비대칭이라 결과가 다르다. 죄수의 딜레마는 우월전략(배신)이 모두를 더 나쁜 칸으로 끌고 가는 비극이지만, 채택 게임은 낙오 페널티 f가 개인과 집단의 유인을 같은 방향으로 정렬시킨다. 남들이 살 때 나만 안 사면 자산 가치 상승에서 소외돼 상대적으로 가난해진다(낙오 페널티 f). 이 페널티 때문에 관망은 열등전략이 되고, 합리적 행위자라면 결국 채택을 택해 '모두 채택'이라는 최선의 결과로 수렴한다 — 이것이 한 국가의 채택이 다른 국가의 채택을 부르는 캐스케이드의 출발점이다."
      />
    </div>
  );
}

function Legend() {
  return (
    <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
      <span className="flex items-center gap-1.5">
        <span className="font-semibold text-sky-600 underline decoration-sky-500 decoration-2 underline-offset-2 dark:text-sky-400">
          밑줄
        </span>
        = 각자의 최적대응
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3 rounded-sm ring-2 ring-amber-500/70" />
        둘 다 밑줄인 칸 = 내쉬 균형
      </span>
      <span>칸 안의 값 = (우리 보수 / 상대 보수)</span>
    </div>
  );
}

function PayoffGrid({
  cells,
  best,
  nash,
  formulas,
  rowHeaders,
  colHeaders,
}: {
  cells: PayoffCells;
  best: BestResponses;
  nash: CellKey;
  formulas?: Record<CellKey, React.ReactNode>;
  rowHeaders: [Header, Header];
  colHeaders: [Header, Header];
}) {
  const rows: { keys: [CellKey, CellKey]; header: Header }[] = [
    { keys: ["AA", "AW"], header: rowHeaders[0] },
    { keys: ["WA", "WW"], header: rowHeaders[1] },
  ];
  return (
    <div className="grid grid-cols-[auto_1fr_1fr] gap-2 text-sm">
      <div />
      <ColHeader {...colHeaders[0]} />
      <ColHeader {...colHeaders[1]} />
      {rows.map((row) => (
        <RowGroup
          key={row.keys[0]}
          header={row.header}
          keys={row.keys}
          cells={cells}
          best={best}
          nash={nash}
          formulas={formulas}
        />
      ))}
    </div>
  );
}

function ColHeader({ icon, label }: Header) {
  return (
    <div className="text-muted-foreground bg-muted/50 flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-center text-xs font-medium">
      {icon}
      {label}
    </div>
  );
}

function RowGroup({
  header,
  keys,
  cells,
  best,
  nash,
  formulas,
}: {
  header: Header;
  keys: [CellKey, CellKey];
  cells: PayoffCells;
  best: BestResponses;
  nash: CellKey;
  formulas?: Record<CellKey, React.ReactNode>;
}) {
  return (
    <>
      <div className="text-muted-foreground bg-muted/50 flex items-center justify-center gap-1 rounded-md px-2 text-center text-xs font-medium">
        {header.icon}
        {header.label}
      </div>
      {keys.map((k) => (
        <PayoffCell
          key={k}
          value={cells[k]}
          meBest={best.meBest[k]}
          themBest={best.themBest[k]}
          isNash={k === nash}
          formula={formulas?.[k]}
        />
      ))}
    </>
  );
}

function PayoffCell({
  value,
  meBest,
  themBest,
  isNash,
  formula,
}: {
  value: [number, number];
  meBest: boolean;
  themBest: boolean;
  isNash: boolean;
  formula?: React.ReactNode;
}) {
  const [me, them] = value;
  const mark = "underline decoration-sky-500 decoration-2 underline-offset-2";
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
        <span
          className={cn(me < 0 && "text-rose-500", meBest && mark)}
        >
          {sign(me)}
        </span>
        <span className="text-muted-foreground"> / </span>
        <span
          className={cn(them < 0 && "text-rose-500", themBest && mark)}
        >
          {sign(them)}
        </span>
      </span>
      {formula && (
        <span className="text-muted-foreground mt-0.5 font-mono text-[11px]">
          ({formula})
        </span>
      )}
      {isNash && (
        <span className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
          내쉬 균형
        </span>
      )}
    </div>
  );
}
