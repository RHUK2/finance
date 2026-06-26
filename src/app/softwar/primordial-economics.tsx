"use client";

import { useCallback, useMemo, useState } from "react";

import { Skull, Zap } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  AgentGrid,
  ControlSlider,
  ExplainCard,
  Metric,
  RoundControls,
  SectionIntro,
} from "../bitcoin-game-theory/components";
import { useRoundEngine } from "../bitcoin-game-theory/use-round-engine";
import {
  type Organism,
  type PredationState,
  buildOrganisms,
  initialPredationState,
  predationStep,
} from "./models";

const N = 180;
const SEED = 24680;

export function PrimordialEconomics() {
  const [meanPower, setMeanPower] = useState(0.45);
  const [pressure, setPressure] = useState(0.5);
  const [speedMs, setSpeedMs] = useState(600);

  const organisms = useMemo(
    () => buildOrganisms(N, meanPower, SEED),
    [meanPower],
  );

  return (
    <div className="flex flex-col gap-4">
      <SectionIntro title="자연의 파워 프로젝션 — 평화주의는 비싸다">
        자연에서 자원과 생존을 지키는 방법은 물리력을 투사하는 것이다(원시 경제학).
        뿔을 부딪히고 영역을 과시하며 &lsquo;공격하면 손해&rsquo;라는 신호를
        보낸다. 포식 압력이 차오를 때, 충분한 물리력을 투사하지 못하는 개체부터
        도태된다. 평화주의(미투사)는 진화적으로 살아남기 어렵다.
      </SectionIntro>

      <Card className="gap-4 p-4">
        <ControlSlider
          icon={<Zap className="size-4 text-amber-500" />}
          label="평균 투사력 (개체군 평균 와트)"
          hint="개체들이 평균적으로 얼마나 강하게 물리력을 투사하는지. 높일수록 생존자가 많아진다."
          value={meanPower}
          onChange={setMeanPower}
          min={0.2}
          max={0.8}
          step={0.01}
          format={(v) => `${Math.round(v * 100)}%`}
        />
        <ControlSlider
          icon={<Skull className="size-4 text-rose-500" />}
          label="포식 압력"
          hint="포식자가 가하는 위협의 강도. 이 수준 미만으로 투사하는 개체는 결국 도태된다."
          value={pressure}
          onChange={setPressure}
          min={0.1}
          max={0.9}
          step={0.01}
          format={(v) => `${Math.round(v * 100)}%`}
        />
      </Card>

      {/* key로 파라미터 변경 시 리마운트 → 깔끔한 초기화 */}
      <PredationSim
        key={`${meanPower}|${pressure}`}
        organisms={organisms}
        pressure={pressure}
        speedMs={speedMs}
        onSpeed={setSpeedMs}
      />

      <ExplainCard
        title="물리적 비용 부과는 생존의 필수 조건"
        body="물리력을 투사하지 못하는 개체는 약탈의 표적이 되어 사라지고, 살아남은 개체군의 평균 투사력은 라운드마다 올라간다. 비트코인 채굴이 소비하는 막대한 전력도 같은 논리다. 낭비처럼 보이는 그 와트가 곧 네트워크가 포식자에게 보내는 &lsquo;공격하면 손해&rsquo; 신호이며, 디지털 자산을 지키는 물리적 비용 벽이다."
      />
    </div>
  );
}

function powerColor(o: Organism): string {
  if (o.type === "강한 투사자") return "bg-emerald-500";
  if (o.type === "약한 방어") return "bg-amber-500";
  return "bg-sky-400";
}

function PredationSim({
  organisms,
  pressure,
  speedMs,
  onSpeed,
}: {
  organisms: Organism[];
  pressure: number;
  speedMs: number;
  onSpeed: (ms: number) => void;
}) {
  const init = useCallback(() => initialPredationState(organisms.length), [organisms]);
  const [sim, setSim] = useState<PredationState>(init);

  const step = useCallback(() => {
    const res = predationStep(sim, organisms, pressure);
    if (!res.changed) return false;
    setSim(res.next);
    return true;
  }, [sim, organisms, pressure]);

  const engine = useRoundEngine(step, speedMs);

  const aliveCount = sim.alive.filter(Boolean).length;
  const dead = organisms.length - aliveCount;
  const survivorAvg =
    aliveCount > 0
      ? organisms.reduce((s, o, i) => s + (sim.alive[i] ? o.power : 0), 0) /
        aliveCount
      : 0;
  const done = sim.threshold >= pressure;
  const states = organisms.map((o, i) =>
    sim.alive[i] ? powerColor(o) : "bg-muted",
  );

  return (
    <>
      <Card className="gap-3 p-4">
        <RoundControls
          playing={engine.playing}
          onToggle={engine.toggle}
          onStep={step}
          onReset={() => {
            engine.pause();
            setSim(init());
          }}
          round={sim.round}
          speedMs={speedMs}
          onSpeed={onSpeed}
          done={done}
        />
        <AgentGrid states={states} />
        <SurvivalCurve history={sim.history} />
        <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <Legend className="bg-emerald-500" label="강한 투사자" />
          <Legend className="bg-amber-500" label="약한 방어" />
          <Legend className="bg-sky-400" label="평화주의자" />
          <Legend className="bg-muted" label="도태됨" />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric label="생존 개체" value={`${aliveCount} / ${organisms.length}`} tone="good" />
        <Metric label="도태 개체" value={`${dead}`} tone="bad" />
        <Metric label="생존자 평균 투사력" value={`${Math.round(survivorAvg * 100)}%`} tone="accent" />
      </div>

      {done && (
        <p
          className={cn(
            "rounded-md px-3 py-2 text-xs",
            aliveCount > 0
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
          )}
        >
          {aliveCount > 0
            ? `포식 압력이 멈춘 시점, 압력 이상으로 물리력을 투사한 ${aliveCount}개체만 살아남았다. 살아남은 개체군의 평균 투사력은 처음보다 높아졌다.`
            : "이 압력에서는 누구도 충분히 투사하지 못해 전멸했다. 평균 투사력을 높여 다시 돌려 보자."}
        </p>
      )}
    </>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-3 rounded-[3px]", className)} />
      {label}
    </span>
  );
}

// 라운드별 생존율 추이를 작은 SVG 라인으로 표시.
function SurvivalCurve({ history }: { history: number[] }) {
  const W = 100;
  const H = 32;
  const pts = history.map((p, i) => {
    const x = history.length <= 1 ? 0 : (i / (history.length - 1)) * W;
    const y = H - p * H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground w-16 shrink-0 text-xs">생존 곡선</span>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-8 w-full">
        <polyline
          points={pts.join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="text-emerald-500"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
