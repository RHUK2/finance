"use client";

import { useState } from "react";
import { Pickaxe, Target } from "lucide-react";

import { Card } from "@/components/ui/card";
import {
  ControlSlider,
  ExplainCard,
  Metric,
  RoundControls,
  SectionIntro,
} from "@/components/simulation";
import { useRoundEngine } from "@/hooks/use-round-engine";
import { cn, shortHex } from "@/lib/utils";
import {
  blockHeaderPrefix,
  expectedTries,
  hashWithNonce,
  meetsTarget,
  SAMPLE_HEADER,
} from "@/lib/block-concept";

// SAMPLE_HEADER는 상수라 접두어도 한 번만 계산해 두면 된다. 채굴 루프는 여기에
// nonce만 이어붙이므로 매 시도마다 헤더 객체를 새로 만들 필요가 없다.
const HEADER_PREFIX = blockHeaderPrefix(SAMPLE_HEADER);

// 목표당 평균 시도 횟수(16^difficulty)를 대략 40틱 안에 끝나도록 배치 크기를 잡는다.
// 낮은 난이도는 한 틱에 한 번씩 눈으로 볼 수 있게, 높은 난이도는 눈에 보이는 속도로 진행되게.
function batchSizeFor(difficulty: number): number {
  return Math.max(1, Math.round(expectedTries(difficulty) / 40));
}

const HUMAN_RATE = 10; // 사람이 손으로 해시 계산기를 두드릴 때: 초당 10회 가정
const ASIC_RATE = 5e14; // 실제 ASIC 채굴기 한 대: 초당 약 500조 회 해시

export function MiningSim() {
  const [difficulty, setDifficulty] = useState(3);

  return (
    <div className="flex flex-col gap-4">
      <SectionIntro title="채굴: 목표 이하의 해시가 나올 때까지 복권 긁기">
        채굴자가 하는 일은 사실 단순하다. nonce를 바꿔가며 헤더를 해시하고,
        결과가 정해진 <b>목표값보다 작은지(=앞자리에 0이 충분히 많은지)</b>{" "}
        확인하는 것뿐이다. 정답을 미리 알 방법은 없으니 그냥 계속 찍어보는
        수밖에 없다. 난이도를 정하고 재생을 눌러 직접 &#39;채굴&#39;해 보자.
      </SectionIntro>

      <Card className="gap-4 p-4">
        <ControlSlider
          icon={
            <Target className="size-4 text-amber-600 dark:text-amber-400" />
          }
          label="목표 난이도 (해시 앞자리 0 개수)"
          hint={`평균 ${expectedTries(difficulty).toLocaleString("ko-KR")}번 시도해야 한 번 나오는 목표. 목표 패턴: ${"0".repeat(difficulty)}…`}
          value={difficulty}
          onChange={setDifficulty}
          min={1}
          max={5}
          step={1}
          format={(v) => `0 × ${v}자리`}
        />
      </Card>

      <MiningEngine key={difficulty} difficulty={difficulty} />

      <ExplainCard
        title="채굴이 전력을 그렇게 많이 먹는 이유"
        preview="사람이 손으로 계산하면 이 목표를 맞추는 데 수백 년이 걸린다. ASIC은 초당 수백조 번을 찍는다."
        body={
          <>
            사람이 계산기로 손수 해시를 두드린다면 초당 {HUMAN_RATE}회가 한계라,
            난이도 5자리(평균 {expectedTries(5).toLocaleString("ko-KR")}번)를
            맞추는 데 수백 년이 걸린다. 실제 ASIC 채굴기 한 대는 초당 약{" "}
            {ASIC_RATE.toLocaleString("ko-KR")}번을 찍고, 전 세계 채굴기를
            합치면 그보다 몇만 배 더 많은 시도를 10분마다 쏟아붓는다. 정답에
            &#39;가까워지는&#39; 과정이 없으니(눈사태 효과), 유일한 전략은 더
            많은 해시를 더 빨리 찍는 것뿐이고, 그게 채굴이 곧 전력 소비 경쟁이
            되는 이유다.
          </>
        }
      />
    </div>
  );
}

function MiningEngine({ difficulty }: { difficulty: number }) {
  // MiningEngine은 부모에서 key={difficulty}로 매번 새로 마운트되므로,
  // 난이도가 바뀌어도 배치 크기는 이 마운트 동안 한 번만 계산하면 된다.
  const batch = batchSizeFor(difficulty);
  const [speedMs, setSpeedMs] = useState(280);
  const [nonce, setNonce] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [hash, setHash] = useState(() => hashWithNonce(HEADER_PREFIX, 0));
  const [found, setFound] = useState(false);

  function step(): boolean {
    if (found) return false;
    let n = nonce;
    let h = hash;
    let tries = 0;
    for (let i = 0; i < batch; i++) {
      n += 1;
      h = hashWithNonce(HEADER_PREFIX, n);
      tries += 1;
      if (meetsTarget(h, difficulty)) break;
    }
    setNonce(n);
    setHash(h);
    setAttempts((a) => a + tries);
    if (meetsTarget(h, difficulty)) {
      setFound(true);
      return false;
    }
    return true;
  }

  const engine = useRoundEngine(step, speedMs);

  return (
    <Card className="flex flex-col gap-3 p-4">
      <RoundControls
        playing={engine.playing}
        onToggle={engine.toggle}
        onStep={step}
        onReset={() => {
          engine.pause();
          setNonce(0);
          setAttempts(0);
          setFound(false);
          setHash(hashWithNonce(HEADER_PREFIX, 0));
        }}
        round={attempts}
        speedMs={speedMs}
        onSpeed={setSpeedMs}
        done={found}
        unit="회 시도"
      />

      <div
        className={cn(
          "flex flex-col gap-1 rounded-md border p-3",
          found
            ? "border-emerald-500/40 bg-emerald-500/5"
            : "bg-muted border-transparent",
        )}
      >
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <Pickaxe
            className={cn(
              "size-4",
              found
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground",
            )}
          />
          {found
            ? `nonce ${nonce}에서 목표를 찾았다!`
            : `nonce ${nonce} 시도 중…`}
        </span>
        <code className="font-mono text-xs break-all">
          {shortHex(hash, 24)}
        </code>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric
          label="시도 횟수"
          value={attempts.toLocaleString("ko-KR")}
          tone="accent"
        />
        <Metric
          label="평균 예상 시도"
          value={expectedTries(difficulty).toLocaleString("ko-KR")}
        />
        <Metric
          label="상태"
          value={found ? "성공" : "탐색 중"}
          tone={found ? "good" : undefined}
        />
      </div>
    </Card>
  );
}
