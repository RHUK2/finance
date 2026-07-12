"use client";

import { useState } from "react";
import { ArrowDown, RotateCcw, StepForward } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExplainCard, Field, SectionIntro } from "@/components/simulation";
import { cn } from "@/lib/utils";
import {
  buildPath,
  COINS,
  illustrativeAddress,
  illustrativeHex,
  PURPOSES,
} from "@/lib/bip-concept";

import { Pipeline, type PipeItem } from "@/components/pipeline";

export function KeyTree({ seedHex }: { seedHex: string }) {
  const [purpose, setPurpose] = useState("84");
  const [coin, setCoin] = useState("0");
  const [account, setAccount] = useState(0);
  const [change, setChange] = useState<0 | 1>(0);
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState(0); // 스텝다운: 지금까지 파생한 노드 인덱스

  const meta = PURPOSES.find((p) => p.value === purpose) ?? PURPOSES[0];
  const path = buildPath({ purpose, coin, account, change, index });
  const address = illustrativeAddress(seedHex, path, purpose);

  const nodes = [
    { val: "m", name: "마스터", hint: "시드에서 나온 뿌리 키", hardened: false },
    { val: `${purpose}'`, name: "purpose", hint: meta.addr, hardened: true },
    { val: `${coin}'`, name: "coin", hint: coin === "0" ? "Bitcoin" : "Testnet", hardened: true },
    { val: `${account}'`, name: "account", hint: `${account}번 계정`, hardened: true },
    { val: `${change}`, name: "change", hint: change === 0 ? "수신용" : "잔돈용", hardened: false },
    { val: `${index}`, name: "index", hint: `${index}번 주소`, hardened: false },
  ];
  const lastStep = nodes.length - 1;
  const node = nodes[step];

  // 각 노드의 확장키 자료(개인키·체인코드·공개키). 모두 결정적 시연용 가짜 값.
  // HMAC-SHA512가 64바이트를 둘로 쪼갠다: 오른쪽 32B = 체인코드.
  // 왼쪽 32B는 마스터에선 개인키 그 자체, 자식 단계에선 부모 개인키에 더할 값(IL)이다.
  // 공개키는 02 + 32B (압축 33바이트) 모양.
  const keysAt = (i: number) => {
    const p = nodes.slice(0, i + 1).map((n) => n.val).join("/");
    return {
      priv: illustrativeHex("priv:" + seedHex + p, 64),
      cc: illustrativeHex("cc:" + seedHex + p, 64),
      pub: "02" + illustrativeHex("pub:" + seedHex + p, 64),
      il: illustrativeHex("il:" + seedHex + p, 64),
    };
  };
  const cur = keysAt(step);
  const parent = keysAt(Math.max(0, step - 1)); // step 0에선 미사용
  const short = (h: string) => h.slice(0, 12) + "…";

  // 현재 단계의 상세 파이프라인: 마스터=시드→HMAC, 그 외=부모키→CKD, 마지막=→주소.
  const detailItems: PipeItem[] =
    step === 0
      ? [
          { kind: "box", label: "시드 (512비트)", value: seedHex },
          {
            kind: "op",
            label: 'HMAC-SHA512 (key = "Bitcoin seed") → 64바이트를 둘로 분할',
          },
          {
            kind: "split",
            boxes: [
              { label: "마스터 개인키 (왼쪽 32B)", value: cur.priv },
              { label: "마스터 체인코드 (오른쪽 32B)", value: cur.cc, tone: "accent" },
            ],
          },
        ]
      : [
          {
            kind: "box",
            label: node.hardened
              ? "CKD 입력 (0x00 + 부모 개인키 + index)"
              : "CKD 입력 (부모 공개키 + index)",
            value: node.hardened
              ? `0x00 ∥ ${short(parent.priv)} ∥ ${node.val}`
              : `${short(parent.pub)} ∥ ${node.val}`,
          },
          {
            kind: "op",
            label: "HMAC-SHA512 (key = 부모 체인코드) → 64바이트를 둘로 분할",
          },
          {
            kind: "split",
            boxes: [
              { label: "IL · 더할 값 (왼쪽 32B)", value: cur.il },
              { label: "자식 체인코드 (오른쪽 32B)", value: cur.cc, tone: "accent" },
            ],
          },
          {
            kind: "op",
            label: "자식 개인키 = (IL + 부모 개인키) mod n",
          },
          {
            kind: "box",
            label: "자식 개인키",
            value: cur.priv,
          },
        ];
  if (step === lastStep) {
    detailItems.push(
      { kind: "op", label: "secp256k1 (개인키 → 공개키, 단방향)" },
      { kind: "box", label: "공개키 (압축 33바이트)", value: cur.pub },
      {
        kind: "op",
        label: `HASH160 → ${meta.charset === "bech32" ? "Bech32" : "Base58Check"} 인코딩`,
      },
      { kind: "box", label: `주소 (${meta.addr})`, value: address, tone: "good" },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionIntro title="시드에서 키 트리로 (BIP-32 / 44)">
        하나의 시드에서 트리처럼 가지를 뻗어 무한히 많은 키를 만든다. 각 가지는{" "}
        <span className="font-mono">m / purpose&apos; / coin&apos; / account&apos; /
        change / index</span> 경로로 지정한다. 아래 값을 바꿔 경로가 어떤 주소로
        이어지는지 따라가 보자.
      </SectionIntro>

      <Card className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3">
        <Field label="purpose (주소 타입)">
          <Select value={purpose} onValueChange={setPurpose}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PURPOSES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="coin type">
          <Select value={coin} onValueChange={setCoin}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COINS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="account">
          <Input
            type="number"
            min={0}
            value={account}
            onChange={(e) => setAccount(Math.max(0, Number(e.target.value) || 0))}
          />
        </Field>

        <Field label="change (수신/잔돈)">
          <div className="flex overflow-hidden rounded-md border">
            {([0, 1] as const).map((c) => (
              <button
                key={c}
                onClick={() => setChange(c)}
                className={cn(
                  "flex-1 px-2 py-1.5 text-sm transition-colors",
                  change === c
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                )}
              >
                {c === 0 ? "0 · 수신" : "1 · 잔돈"}
              </button>
            ))}
          </div>
        </Field>

        <Field label="address index">
          <Input
            type="number"
            min={0}
            value={index}
            onChange={(e) => setIndex(Math.max(0, Number(e.target.value) || 0))}
          />
        </Field>
      </Card>

      <Card className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold">
            시드에서 주소까지, 한 단계씩 파생하기
          </span>
          <span className="text-muted-foreground text-xs tabular-nums">
            {step + 1} / {nodes.length} 단계
          </span>
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed">
          경로는 한 번에 나오지 않는다. 부모 키에서 가지 하나를 파생하면 나온 자식
          키가 다시 다음 가지의 부모가 된다. 각 노드는 확장 개인키(xprv)와 확장
          공개키(xpub)를 갖는데, 하드닝(&apos;)된 가지는 부모 개인키가 있어야만
          파생된다. 노드를 눌러 단계를 오갈 수 있다.
        </p>

        {/* 트리 지도 */}
        <ol className="flex flex-col">
          {nodes.map((n, i) => {
            const revealed = i <= step;
            const current = i === step;
            return (
              <li key={i} className="flex flex-col">
                {i > 0 && (
                  <div
                    className={cn(
                      "flex items-center gap-1.5 py-1 pl-[13px] text-xs",
                      revealed
                        ? "text-muted-foreground"
                        : "text-muted-foreground/40",
                    )}
                  >
                    <ArrowDown className="size-3.5 shrink-0" />
                    {n.hardened
                      ? `🔒 CKD ${n.val} · 하드닝 (부모 개인키 필요)`
                      : `👁 CKD ${n.val} · 일반 (부모 공개키로 충분)`}
                  </div>
                )}
                <button
                  onClick={() => setStep(i)}
                  className={cn(
                    "flex items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors",
                    current
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50 border-transparent",
                    !revealed && "opacity-40",
                  )}
                >
                  <span
                    className={cn(
                      "size-3 shrink-0 rounded-full",
                      current
                        ? "bg-primary"
                        : revealed
                          ? "bg-muted-foreground"
                          : "border-muted-foreground/40 border",
                    )}
                  />
                  <span className="w-14 font-mono text-sm font-semibold">
                    {n.val}
                  </span>
                  <span className="text-muted-foreground w-16 text-xs">
                    {n.name}
                  </span>
                  <span className="text-muted-foreground text-xs">{n.hint}</span>
                </button>
              </li>
            );
          })}
        </ol>

        {/* 현재 단계 상세 */}
        <div className="bg-muted/30 flex flex-col gap-3 rounded-lg border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold">{node.val}</span>
            <span className="text-muted-foreground text-xs">
              {node.name} · {node.hint}
            </span>
            {step > 0 && (
              <span
                className={cn(
                  "ml-auto flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
                  node.hardened
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                )}
              >
                {node.hardened
                  ? "🔒 하드닝 · 부모 개인키 필요"
                  : "👁 일반 · 부모 공개키로 충분"}
              </span>
            )}
          </div>

          <Pipeline items={detailItems} />

          <div className="flex flex-col gap-1.5">
            <div className="bg-muted flex flex-col gap-0.5 rounded-md p-2.5">
              <span className="text-xs font-semibold">🔒 확장 개인키 (xprv)</span>
              <code className="font-mono text-[11px] break-all">
                {short(cur.priv)} ∥ {short(cur.cc)}
              </code>
              <span className="text-muted-foreground text-[10px]">
                개인키 + 체인코드 · 비밀
              </span>
            </div>
            <div className="text-muted-foreground flex items-center gap-1.5 pl-[13px] text-[10px]">
              <ArrowDown className="size-3.5 shrink-0" />
              개인키에만 secp256k1 적용 → 공개키, 체인코드는 그대로 복사
            </div>
            <div className="bg-muted flex flex-col gap-0.5 rounded-md p-2.5">
              <span className="text-xs font-semibold">👁 확장 공개키 (xpub)</span>
              <code className="font-mono text-[11px] break-all">
                {short(cur.pub)} ∥ {short(cur.cc)}
              </code>
              <span className="text-muted-foreground text-[10px]">
                공개키 + 체인코드 · 공유 가능
              </span>
            </div>
          </div>

          <p className="text-muted-foreground text-xs leading-relaxed">
            {step === 0
              ? "시드에서 나온 뿌리 키. 여기서부터 모든 노드가 개인키+체인코드(xprv)와 공개키+체인코드(xpub) 짝을 갖는다."
              : node.hardened
                ? "입력에 부모 개인키가 들어가므로, xpub(공개키)만 가진 사람은 이 가지를 파생할 수 없다. 그래서 purpose·coin·account 같은 상위 단계를 하드닝해 형제·부모 키를 지킨다."
                : "입력에 부모 공개키만 쓰이므로, xpub만으로도 자식 공개키와 주소를 끝없이 만들 수 있다. 그래서 change·index는 하드닝하지 않아 watch-only 지갑이 주소를 뽑을 수 있다."}
          </p>
        </div>

        {/* 컨트롤 */}
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
          <span className="text-muted-foreground ml-auto text-xs">
            {step === lastStep
              ? "주소까지 완성"
              : "부모 키에서 다음 가지를 파생한다"}
          </span>
        </div>
      </Card>

      <ExplainCard
        title="작은따옴표(')는 무슨 뜻일까? (하드닝)"
        preview="44' 처럼 붙는 따옴표는 부모 공개키로 역추적을 막는 하드닝 표시다."
        body={
          <>
            <span className="font-mono">44&apos;</span>처럼 붙은 따옴표는{" "}
            <b>하드닝(hardened)</b> 표시다. 하드닝된 가지는 부모 비밀키 없이는 절대
            파생할 수 없어, 자식 키 하나가 새도 형제·부모 키가 안전하다. 그래서
            purpose·coin·account 같은 상위 단계는 하드닝하고, 매일 새 주소를 찍어야 하는
            change·index는 하드닝하지 않아 공개키만으로도 주소를 미리 만들 수 있게 한다.
            (이 데모의 주소는 시연용 값이다.)
          </>
        }
      />
    </div>
  );
}
