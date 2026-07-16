"use client";

import { useMemo, useState } from "react";
import {
  CircleCheck,
  CircleX,
  RotateCcw,
  StepForward,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ExplainCard,
  Field,
  SectionIntro,
  SegmentedControl,
} from "@/components/simulation";
import { cn, shortHex } from "@/lib/utils";
import {
  addrMeta,
  illustrativeEcdsaSig,
  illustrativeHash160,
  illustrativePubKey,
  illustrativeSchnorrSig,
  illustrativeSighash,
  illustrativeXOnlyPubKey,
  type ScriptAddrType,
} from "@/lib/script-concept";

type StackItem = { label: string; value: string; tone?: "good" | "bad" };
type Result = { stack: StackItem[]; halted: boolean };

type StepDef = {
  label: string; // 예: "<sig> 푸시"
  detail: string; // 이 연산이 하는 일
  source: "scriptSig" | "witness" | "scriptPubKey";
  run: (stack: StackItem[]) => Result;
};

const push =
  (item: StackItem) =>
  (stack: StackItem[]): Result => ({ stack: [...stack, item], halted: false });

function buildSteps(type: ScriptAddrType, tamper: boolean): StepDef[] {
  const digest = illustrativeSighash("데모 트랜잭션");
  const priv = "priv:demo"; // 실제 개인키 값은 signature-lab에서 다룬다. 여기선 스택 흐름이 초점.

  if (type === "taproot") {
    const outputKey = illustrativeXOnlyPubKey("demo");
    const sigDigest = tamper ? illustrativeSighash("변조된 트랜잭션") : digest;
    const sig = illustrativeSchnorrSig(priv, sigDigest);
    const valid = !tamper;
    return [
      {
        label: "<schnorrSig> 푸시",
        detail: "witness에 서명 하나만 올라간다. scriptSig는 아예 비어 있다.",
        source: "witness",
        run: push({ label: "sig", value: shortHex(sig) }),
      },
      {
        label: "OP_CHECKSIG (키 경로)",
        detail: valid
          ? `출력에 박혀 있던 x-only 공개키(${shortHex(outputKey)})로 Schnorr 서명을 직접 검증한다. 별도 스크립트 실행 없이 이 한 번의 검사로 끝난다.`
          : "다른 트랜잭션에 대해 만든 서명이라 출력 공개키로 검증에 실패한다. 스크립트가 즉시 실패로 종료된다.",
        source: "scriptPubKey",
        run: (stack) => ({
          stack: [
            ...stack.slice(0, -1),
            valid
              ? { label: "결과", value: "true", tone: "good" }
              : { label: "결과", value: "false (검증 실패)", tone: "bad" },
          ],
          halted: !valid,
        }),
      },
    ];
  }

  const onWitness = type === "native";
  const source: StepDef["source"] = onWitness ? "witness" : "scriptSig";
  const realPub = illustrativePubKey("demo");
  const attackerPub = illustrativePubKey("attacker");
  const pushedPub = tamper ? attackerPub : realPub;
  const pubKeyHash = illustrativeHash160(realPub); // 출력에 박힌 진짜 해시(변조와 무관)
  const ecdsa = illustrativeEcdsaSig(priv, digest);
  const sig = ecdsa.r + ecdsa.s + ecdsa.sighashFlag;

  return [
    {
      label: "<sig> 푸시",
      detail: onWitness
        ? "witness의 첫 항목. scriptSig는 비어 있다(SegWit 할인의 이유)."
        : "scriptSig의 첫 항목으로 서명을 스택에 올린다.",
      source,
      run: push({ label: "sig", value: shortHex(sig) }),
    },
    {
      label: "<pubKey> 푸시",
      detail: tamper
        ? "공격자가 자기 공개키를 대신 밀어 넣었다."
        : onWitness
          ? "witness의 두 번째 항목으로 공개키를 올린다."
          : "scriptSig의 두 번째 항목으로 공개키를 올린다.",
      source,
      run: push({ label: "pubKey", value: shortHex(pushedPub) }),
    },
    {
      label: "OP_DUP",
      detail: "스택 맨 위(pubKey)를 그대로 복제해 하나 더 쌓는다.",
      source: "scriptPubKey",
      run: (stack) => ({
        stack: [...stack, { ...stack[stack.length - 1] }],
        halted: false,
      }),
    },
    {
      label: "OP_HASH160",
      detail: "맨 위 값(pubKey 복제본)을 HASH160(pubKey)으로 치환한다.",
      source: "scriptPubKey",
      run: (stack) => ({
        stack: [
          ...stack.slice(0, -1),
          {
            label: "HASH160(pubKey)",
            value: shortHex(illustrativeHash160(pushedPub)),
          },
        ],
        halted: false,
      }),
    },
    {
      label: "<pubKeyHash> 푸시",
      detail: "출력(scriptPubKey)에 미리 박혀 있던 20바이트 해시를 올린다.",
      source: "scriptPubKey",
      run: push({ label: "pubKeyHash", value: shortHex(pubKeyHash) }),
    },
    {
      label: "OP_EQUALVERIFY",
      detail: tamper
        ? "맨 위 두 값(HASH160(공격자 pubKey) vs 진짜 pubKeyHash)이 다르다. 즉시 실패, 스크립트 종료."
        : "맨 위 두 값(HASH160(pubKey) vs pubKeyHash)이 같은지 비교하고 둘 다 제거한다. 다르면 즉시 실패한다.",
      source: "scriptPubKey",
      run: (stack) => {
        if (tamper) {
          return {
            stack: [
              ...stack.slice(0, -2),
              { label: "결과", value: "실패 (해시 불일치)", tone: "bad" },
            ],
            halted: true,
          };
        }
        return { stack: stack.slice(0, -2), halted: false };
      },
    },
    {
      label: "OP_CHECKSIG",
      detail: "남은 pubKey·sig 두 값으로 서명을 검증하고 결과를 푸시한다.",
      source: "scriptPubKey",
      run: (stack) => ({
        stack: [
          ...stack.slice(0, -2),
          { label: "결과", value: "true", tone: "good" },
        ],
        halted: false,
      }),
    },
  ];
}

function StackBox({ item, top }: { item: StackItem; top: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-md border px-3 py-1.5 text-xs",
        item.tone === "good" && "border-emerald-500/40 bg-emerald-500/10",
        item.tone === "bad" && "border-rose-500/40 bg-rose-500/10",
        !item.tone && "bg-muted",
        top && !item.tone && "border-primary/40",
      )}
    >
      <span className="text-muted-foreground shrink-0">{item.label}</span>
      <code className="font-mono break-all">{item.value}</code>
    </div>
  );
}

export function ScriptStack() {
  const [type, setType] = useState<ScriptAddrType>("legacy");
  const [tamper, setTamper] = useState(false);
  const [step, setStep] = useState(0);

  const steps = useMemo(() => buildSteps(type, tamper), [type, tamper]);

  // 각 단계까지 스택을 순서대로 재현. halted 이후 단계는 실행되지 않은 것으로 표시.
  const snapshots = useMemo(() => {
    const out: { stack: StackItem[]; halted: boolean }[] = [];
    let stack: StackItem[] = [];
    let haltedAt = -1;
    for (let i = 0; i < steps.length; i++) {
      if (haltedAt >= 0) {
        out.push({ stack, halted: true });
        continue;
      }
      const res = steps[i].run(stack);
      stack = res.stack;
      out.push({ stack, halted: false });
      if (res.halted) haltedAt = i;
    }
    return out;
  }, [steps]);

  function changeType(t: ScriptAddrType) {
    setType(t);
    setStep(0);
  }

  const lastStep = steps.length - 1;
  const cur = snapshots[step];
  const topTone = cur.stack.at(-1)?.tone;
  const isTerminal = topTone === "good" || topTone === "bad";
  const meta = addrMeta(type);

  return (
    <div className="flex flex-col gap-4">
      <SectionIntro title="스크립트는 스택 머신에서 실행된다">
        노드는 잠금(scriptPubKey)과 풀이(scriptSig 또는 witness)를 이어 붙여{" "}
        <b>스택</b> 위에서 한 줄씩 실행한다. 값을 쌓거나(push), 맨 위 값을
        복제·치환하거나, 두 값을 비교해 지워 나가다가 마지막에 참(true)이 남으면
        지출이 허용된다. 주소 타입을 바꿔 가며 한 단계씩 실행해 보자.
      </SectionIntro>

      <Card className="flex flex-col gap-4 p-4">
        <Field label="주소 타입">
          <SegmentedControl
            options={[
              { value: "legacy", label: "Legacy" },
              { value: "native", label: "Native SegWit" },
              { value: "taproot", label: "Taproot" },
            ]}
            value={type}
            onChange={changeType}
          />
        </Field>

        <Field label="서명자">
          <SegmentedControl
            options={[
              { value: false, label: "정당한 소유자" },
              { value: true, label: "공격자(잘못된 키/서명)" },
            ]}
            value={tamper}
            onChange={(v) => {
              setTamper(v);
              setStep(0);
            }}
          />
        </Field>
      </Card>

      <Card className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold">
            {meta.label} · {meta.sigAlgo} · unlock은 {meta.unlockField}
          </span>
          <span className="text-muted-foreground text-xs tabular-nums">
            {step + 1} / {steps.length} 단계
          </span>
        </div>

        {/* 지금까지의 연산 로그 */}
        <ol className="flex flex-col gap-1">
          {steps.map((s, i) => {
            const reached = i <= step;
            const dead = snapshots[i]?.halted && i !== 0;
            return (
              <li
                key={i}
                className={cn(
                  "flex items-start gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors",
                  i === step
                    ? "border-primary bg-primary/5"
                    : "border-transparent",
                  !reached && "opacity-40",
                )}
              >
                <span className="text-muted-foreground w-24 shrink-0 font-mono whitespace-nowrap">
                  {s.source}
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono font-medium">
                    {s.label}
                    {dead && reached && (
                      <span className="text-muted-foreground ml-1.5 font-sans">
                        (실행 안 됨 · 스크립트 이미 종료)
                      </span>
                    )}
                  </span>
                  {reached && !dead && (
                    <span className="text-muted-foreground">{s.detail}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        {/* 현재 스택 */}
        <div className="bg-muted/30 flex flex-col gap-2 rounded-lg border p-3">
          <span className="text-muted-foreground text-xs font-semibold">
            현재 스택 (위가 TOP)
          </span>
          <div className="flex flex-col-reverse gap-1.5">
            {cur.stack.length === 0 ? (
              <span className="text-muted-foreground text-xs">비어 있음</span>
            ) : (
              cur.stack.map((it, i) => (
                <StackBox key={i} item={it} top={i === cur.stack.length - 1} />
              ))
            )}
          </div>
        </div>

        {isTerminal && (
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-md border p-2.5 text-sm font-medium",
              topTone === "good"
                ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                : "border-rose-500/40 bg-rose-500/5 text-rose-600 dark:text-rose-400",
            )}
          >
            {topTone === "good" ? (
              <CircleCheck className="size-4 shrink-0" />
            ) : (
              <CircleX className="size-4 shrink-0" />
            )}
            {topTone === "good"
              ? "스택에 참(true)만 남았다 → 지출 허용"
              : "검증 실패 → 지출 거부"}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setStep(0)}
            disabled={step === 0}
            className="gap-1.5"
          >
            <RotateCcw className="size-4" />
            처음부터
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            이전
          </Button>
          <Button
            size="sm"
            onClick={() => setStep((s) => Math.min(lastStep, s + 1))}
            disabled={step === lastStep}
            className="gap-1.5"
          >
            <StepForward className="size-4" />
            다음 단계
          </Button>
        </div>
      </Card>

      <ExplainCard
        title="Taproot 키 경로는 왜 스크립트가 이렇게 짧을까?"
        preview="Legacy·SegWit은 매번 잠금 스크립트를 다시 실행하지만, Taproot 키 경로는 검사 한 번으로 끝난다."
        body={
          <>
            Legacy와 Native SegWit은 서명이 실리는 위치(scriptSig vs witness)만
            다를 뿐, 실행되는 스크립트는{" "}
            <b>OP_DUP → OP_HASH160 → OP_EQUALVERIFY → OP_CHECKSIG</b>로 완전히
            같다. 출력이 담고 있는 건 공개키의 해시(pubKeyHash)뿐이라, 진짜
            공개키가 맞는지부터 확인해야 하기 때문이다.
            <br />
            <br />
            Taproot 키 경로는 출력에 <b>공개키 원본(x-only)</b>을 그대로 담는다.
            그래서 해시를 확인하는 절차 자체가 필요 없고, 서명 하나를 그
            공개키로 직접 검증하는 <b>OP_CHECKSIG 한 번</b>으로 끝난다. 더
            복잡한 조건(다중서명, 시간잠금 등)을 걸고 싶으면 &#39;스크립트
            경로&#39;를 따로 쓰는데, 그 경로를 쓰지 않는 한 검증자는 이게 단순
            지출인지 복잡한 조건부 지출인지조차 구분할 수 없다. 이게 프라이버시
            이점이다.
          </>
        }
      />

      <ExplainCard
        title="OP_EQUALVERIFY에서 실패하면 OP_CHECKSIG는 왜 안 열어볼까?"
        preview="스크립트는 순서대로 실행되다 하나라도 실패하면 그 자리에서 즉시 멈춘다."
        body={
          <>
            스크립트 실행은 <b>중간에 하나라도 실패하면 즉시 중단</b>된다.
            위에서 공격자로 바꿔 실행해 보면, OP_EQUALVERIFY 단계에서 이미
            해시가 다르다는 게 드러나 스크립트가 거기서 끝나 버린다. 그 뒤에
            있는 OP_CHECKSIG는 아예 실행되지 않는다.
            <br />
            <br />
            이건 &#39;진짜 소유자인지&#39;와 &#39;서명이 유효한지&#39;를 굳이
            분리해 순서대로 검사하기 때문이다. 엉뚱한 공개키로는 아무리 서명을
            잘 만들어도 애초에 그 공개키가 이 출력의 주인이라는 걸 증명하지 못해
            검증까지 갈 필요조차 없다.
          </>
        }
      />

      <Card className="flex items-start gap-2 border-amber-500/40 bg-amber-500/5 p-3 text-xs">
        <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="text-muted-foreground">
          여기 쌓이는 sig·pubKey·hash 값은 흐름을 보여주기 위한 결정적 가짜
          값이다(SHA-256, HASH160, ECDSA/Schnorr 서명·검증을 단순화). 실행
          순서와 스택 규칙만 실제와 같다.
        </p>
      </Card>
    </div>
  );
}
