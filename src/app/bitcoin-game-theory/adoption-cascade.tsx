"use client";

import { useCallback, useMemo, useState } from "react";

import { Users } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  AgentGrid,
  ControlSlider,
  ExplainCard,
  Metric,
  RoundControls,
  SectionIntro,
} from "@/components/simulation";
import { type CascadeAgent, buildCascadeAgents, cascadeStep } from "./models";
import { useRoundEngine } from "@/hooks/use-round-engine";

const N = 180;
const SEED = 12345;

// 임계값이 가장 낮은 seedCount명을 초기 채택자로 둔다.
function seedAdopted(agents: CascadeAgent[], seedCount: number): boolean[] {
  const order = agents
    .map((a, i) => [a.threshold, i] as const)
    .sort((a, b) => a[0] - b[0]);
  const set = new Set(order.slice(0, seedCount).map(([, i]) => i));
  return agents.map((_, i) => set.has(i));
}

export function AdoptionCascade() {
  const [meanThreshold, setMeanThreshold] = useState(0.3);
  const [seedCount, setSeedCount] = useState(6);
  const [speedMs, setSpeedMs] = useState(600);

  const agents = useMemo(
    () => buildCascadeAgents(N, meanThreshold, SEED),
    [meanThreshold],
  );

  return (
    <div className="flex flex-col gap-4">
      <SectionIntro title="채택 캐스케이드 — 도미노처럼 번지는 채택">
        각 행위자는 저마다 &lsquo;임계값&rsquo;을 갖는다. 주변 채택률이 그 선을
        넘으면 채택에 동참한다(Granovetter 임계값 모델). 개인이 먼저 움직이고, 채택률이
        오르면 기업이, 마지막엔 보수적인 국가까지 합류한다. 한 번 임계점을 넘으면
        멈추기 어려운 연쇄가 시작된다.
      </SectionIntro>

      <Card className="gap-4 p-4">
        <ControlSlider
          label="따라 사는 기준 (평균 임계값)"
          hint="주변에 몇 %가 사야 나도 따라 사는지. 낮출수록 남들 눈치 안 보고 일찍 동참해 더 잘 번진다."
          value={meanThreshold}
          onChange={setMeanThreshold}
          min={0.1}
          max={0.6}
          step={0.01}
          format={(v) => `${Math.round(v * 100)}%`}
        />
        <ControlSlider
          icon={<Users className="size-4 text-amber-500" />}
          label="처음 사는 사람 수 (시드)"
          hint="아무도 안 사도 맨 먼저 움직이는 불씨. 이 사람들이 도미노의 첫 장을 쓰러뜨린다."
          value={seedCount}
          onChange={setSeedCount}
          min={1}
          max={30}
          format={(v) => `${v}명`}
        />
      </Card>

      {/* key로 파라미터 변경 시 리마운트 → 깔끔한 초기화 */}
      <CascadeSim
        key={`${meanThreshold}|${seedCount}`}
        agents={agents}
        seedCount={seedCount}
        speedMs={speedMs}
        onSpeed={setSpeedMs}
      />

      <ExplainCard
        title="티핑 포인트의 비대칭성"
        body="채택은 선형으로 늘지 않는다. 초기엔 더디다가 임계점을 넘는 순간 S자 곡선을 그리며 폭발적으로 번진다. 한 국가가 전략적 준비자산으로 비트코인을 채택하면 다른 국가의 채택 임계값을 넘겨 버리고, 그 채택이 또 다음 국가의 임계값을 넘긴다. 먼저 움직일수록 유리하다는 보수 구조가 이 연쇄를 멈추기 어렵게 만든다."
      />
    </div>
  );
}

type Sim = { adopted: boolean[]; round: number; history: number[] };

function CascadeSim({
  agents,
  seedCount,
  speedMs,
  onSpeed,
}: {
  agents: CascadeAgent[];
  seedCount: number;
  speedMs: number;
  onSpeed: (ms: number) => void;
}) {
  const init = useCallback((): Sim => {
    const adopted = seedAdopted(agents, seedCount);
    return { adopted, round: 0, history: [adopted.filter(Boolean).length / N] };
  }, [agents, seedCount]);

  const [sim, setSim] = useState<Sim>(init);

  // 현재 sim에서 다음 상태를 계산. 변화 여부를 동기적으로 반환해 엔진이
  // 캐스케이드 종료 시점을 정확히 판단하게 한다.
  const step = useCallback(() => {
    const res = cascadeStep(agents, sim.adopted);
    if (!res.changed) return false;
    setSim({
      adopted: res.next,
      round: sim.round + 1,
      history: [...sim.history, res.next.filter(Boolean).length / N],
    });
    return true;
  }, [agents, sim]);

  const engine = useRoundEngine(step, speedMs);

  const adoptedCount = sim.adopted.filter(Boolean).length;
  const p = adoptedCount / N;
  const done = !cascadeStep(agents, sim.adopted).changed && sim.round > 0;
  const states = sim.adopted.map((a) => (a ? "bg-amber-500" : "bg-muted"));

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
        <AdoptionCurve history={sim.history} />
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric label="채택률" value={`${Math.round(p * 100)}%`} tone="accent" />
        <Metric label="채택자" value={`${adoptedCount} / ${N}`} />
        <Metric label="남은 관망자" value={`${N - adoptedCount}`} />
      </div>

      {done && (
        <p
          className={cn(
            "rounded-md px-3 py-2 text-xs",
            p > 0.9
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              : "bg-muted text-muted-foreground",
          )}
        >
          {p > 0.9
            ? "🔥 임계점을 넘어 거의 전원이 채택했다. 초기 소수의 움직임이 전체로 번졌다."
            : "확산이 임계점에 못 미쳐 멈췄다. 시드를 늘리거나 평균 임계값을 낮춰 다시 돌려 보자."}
        </p>
      )}
    </>
  );
}

// 라운드별 채택률 추이를 작은 SVG 라인으로 표시.
function AdoptionCurve({ history }: { history: number[] }) {
  const W = 100;
  const H = 32;
  const pts = history.map((p, i) => {
    const x = history.length <= 1 ? 0 : (i / (history.length - 1)) * W;
    const y = H - p * H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground w-16 shrink-0 text-xs">
        채택 곡선
      </span>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-8 w-full"
      >
        <polyline
          points={pts.join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="text-amber-500"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
