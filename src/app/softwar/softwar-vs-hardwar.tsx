"use client";

import { useMemo, useState } from "react";

import { Bomb, HeartPulse, ShieldCheck, Swords, Zap } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  ControlSlider,
  ExplainCard,
  Metric,
  SectionIntro,
} from "../bitcoin-game-theory/components";
import { deterrence } from "./models";

export function SoftwarVsHardwar() {
  const [projectedPower, setProjectedPower] = useState(50);
  const [adversaryBenefit, setAdversaryBenefit] = useState(40);

  const r = useMemo(
    () => deterrence({ projectedPower, adversaryBenefit }),
    [projectedPower, adversaryBenefit],
  );

  return (
    <div className="flex flex-col gap-4">
      <SectionIntro title="소프트워 vs 하드워 — 같은 억지, 다른 대가">
        적을 억지하려면 적의 BCRA(공격 이득 ÷ 내가 투사한 권력)를 1 미만으로
        낮춰야 한다. 권력 투사의 매개체는 역사적으로 군대(영토) → 핵무기(MAD) →
        비트코인(전기)으로 바뀌어 왔다. 같은 억지 효과라도 <b>하드워</b>는 유혈과
        파괴를 동반하지만, <b>소프트워</b>는 인명 피해 없이 전기만 소비한다. (수치는
        개념용 예시)
      </SectionIntro>

      <Card className="gap-4 p-4">
        <ControlSlider
          icon={<Zap className="size-4 text-amber-500" />}
          label="투사 권력량"
          hint="내가 적에게 부과하는 위협의 크기. 적의 공격 이득 이상으로 올리면 억지에 성공한다."
          value={projectedPower}
          onChange={setProjectedPower}
          min={1}
          max={100}
          format={(v) => `${v}`}
        />
        <ControlSlider
          icon={<Swords className="size-4 text-rose-500" />}
          label="적의 공격 이득"
          hint="적이 공격에 성공해 얻는 가치. 이보다 작게 투사하면 억지에 실패한다."
          value={adversaryBenefit}
          onChange={setAdversaryBenefit}
          min={1}
          max={100}
          format={(v) => `${v}`}
        />
      </Card>

      <Card
        className={cn(
          "flex-row items-center gap-3 p-4",
          r.deterred
            ? "border-emerald-500/40 bg-emerald-500/5"
            : "border-rose-500/40 bg-rose-500/5",
        )}
      >
        <ShieldCheck
          className={cn(
            "size-5 shrink-0",
            r.deterred ? "text-emerald-500" : "text-rose-500",
          )}
        />
        <p className="text-sm leading-relaxed">
          적의 BCRA ={" "}
          <b className={r.deterred ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
            {r.bcra.toFixed(2)}
          </b>{" "}
          —{" "}
          {r.deterred
            ? "1 미만이라 공격이 손해. 억지에 성공했다. 이 결과는 하드워든 소프트워든 동일하다."
            : "1 이상이라 공격이 이득. 억지에 실패했다. 투사 권력을 더 올려야 한다."}
        </p>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="gap-3 p-4">
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            <Bomb className="size-4 text-rose-500" />
            하드워 (유혈 권력 투사)
          </span>
          <Metric
            label="환산 인명 피해"
            value={`${r.hardCasualties.toLocaleString()}명`}
            tone="bad"
          />
          <p className="text-muted-foreground text-xs leading-relaxed">
            군대·핵무기로 같은 억지를 달성하려면 투사력에 비례해 인명과 자산이
            파괴된다. 억지력을 키울수록 부수 피해도 함께 커진다.
          </p>
        </Card>
        <Card className="gap-3 p-4">
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            <HeartPulse className="size-4 text-emerald-500" />
            소프트워 (전기 권력 투사)
          </span>
          <Metric label="환산 인명 피해" value="0명" tone="good" />
          <p className="text-muted-foreground text-xs leading-relaxed">
            작업증명은 전기만 소비해 같은 억지 효과를 낸다. 비용은 전기료뿐,
            흘리는 피는 없다. 권력을 키워도 인명 피해는 0으로 유지된다.
          </p>
        </Card>
      </div>

      <ExplainCard
        title="비트코인은 부드러운 전쟁이다"
        body="핵 억지(MAD)가 '먼저 쏘면 같이 죽는다'는 BCRA로 70여 년의 평화를 지탱했듯, 비트코인은 '디지털 자산을 뺏으려면 전 세계 채굴 전력을 능가하는 에너지를 쏟아야 한다'는 BCRA로 자산을 지킨다. 차이는 매개체다 — 핵은 도시를, 작업증명은 전기만 태운다. 로워리는 이를 유혈 없는 권력 투사, 곧 소프트워라 불렀다."
      />
    </div>
  );
}
