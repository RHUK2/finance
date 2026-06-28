"use client";

import { useState } from "react";
import { Wallet } from "lucide-react";

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

import { Pipeline } from "@/components/pipeline";

export function KeyTree({ seedHex }: { seedHex: string }) {
  const [purpose, setPurpose] = useState("84");
  const [coin, setCoin] = useState("0");
  const [account, setAccount] = useState(0);
  const [change, setChange] = useState<0 | 1>(0);
  const [index, setIndex] = useState(0);

  const meta = PURPOSES.find((p) => p.value === purpose) ?? PURPOSES[0];
  const path = buildPath({ purpose, coin, account, change, index });
  const address = illustrativeAddress(seedHex, path, purpose);

  // 개념 시연용 키 자료(모두 결정적 가짜 값). HMAC-SHA512는 64바이트를 둘로 쪼갠다:
  // 왼쪽 32B = 키, 오른쪽 32B = 체인코드. 공개키는 02 + 32B (압축 33바이트) 모양.
  const masterKey = illustrativeHex("master:" + seedHex, 64);
  const masterChainCode = illustrativeHex("chaincode:" + seedHex, 64);
  const childKey = illustrativeHex("childpriv:" + seedHex + path, 64);
  const childChainCode = illustrativeHex("childcc:" + seedHex + path, 64);
  const pubkey = "02" + illustrativeHex("pub:" + seedHex + path, 64);

  const segments = [
    { val: "m", name: "마스터", hint: "시드에서 나온 뿌리 키" },
    { val: `${purpose}'`, name: "purpose", hint: meta.addr },
    { val: `${coin}'`, name: "coin", hint: coin === "0" ? "Bitcoin" : "Testnet" },
    { val: `${account}'`, name: "account", hint: `${account}번 계정` },
    { val: `${change}`, name: "change", hint: change === 0 ? "수신용" : "잔돈용" },
    { val: `${index}`, name: "index", hint: `${index}번 주소` },
  ];

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

      <Card className="flex flex-col gap-3 p-4">
        <span className="text-muted-foreground text-xs">파생 경로</span>
        <div className="flex flex-wrap items-stretch gap-1.5">
          {segments.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-muted-foreground font-mono">/</span>}
              <div className="bg-muted flex min-w-14 flex-col items-center rounded-md px-2 py-1.5">
                <span className="font-mono text-sm font-semibold">{s.val}</span>
                <span className="text-muted-foreground text-[10px]">{s.name}</span>
                <span className="text-muted-foreground text-[10px]">{s.hint}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          <Wallet className="size-4" />
          시드에서 주소까지 ({meta.addr})
        </span>
        <Pipeline
          items={[
            { kind: "box", label: "시드 (512비트)", value: seedHex },
            { kind: "op", label: "HMAC-SHA512 (key = \"Bitcoin seed\") → 64바이트를 둘로 분할" },
            {
              kind: "split",
              boxes: [
                { label: "마스터 개인키 (왼쪽 32B)", value: masterKey },
                {
                  label: "마스터 체인코드 (오른쪽 32B)",
                  value: masterChainCode,
                  tone: "accent",
                },
              ],
            },
            {
              kind: "op",
              label: `경로 ${path} 한 단계씩 반복 (CKD: 부모키 + 체인코드 + index → HMAC-SHA512)`,
            },
            {
              kind: "split",
              boxes: [
                { label: "자식 개인키", value: childKey },
                { label: "자식 체인코드", value: childChainCode, tone: "accent" },
              ],
            },
            { kind: "op", label: "secp256k1 (개인키 → 공개키, 단방향)" },
            { kind: "box", label: "자식 공개키 (압축 33바이트)", value: pubkey },
            {
              kind: "op",
              label: `HASH160 → ${meta.charset === "bech32" ? "Bech32" : "Base58Check"} 인코딩`,
            },
            { kind: "box", label: `주소 (${meta.addr})`, value: address, tone: "good" },
          ]}
        />
        <p className="text-muted-foreground text-xs">
          공개키 파생(secp256k1)과 RIPEMD-160은 브라우저 내장 암호 API에 없어서, 이
          데모의 중간 키·체인코드·주소는 결정적 가짜 값이다. 단계 자체는 실제 BIP-32
          흐름과 같다.
        </p>
      </Card>

      <ExplainCard
        title="체인코드는 왜 필요할까? — 확장키(xprv/xpub)"
        body={
          <>
            개인키 하나만으로는 자식 키를 만들 수 없다. BIP-32는 HMAC-SHA512로 64바이트를
            쪼개 개인키 옆에 같은 길이의 <b>체인코드</b>를 둔다. 이 둘을 합친 게
            확장키다 — <span className="font-mono">개인키 + 체인코드 = xprv</span>,{" "}
            <span className="font-mono">공개키 + 체인코드 = xpub</span>. 체인코드가 있어야
            매번 다른 자식 키가 결정적으로 파생되고, xpub만 넘기면 개인키 없이도 수신
            주소를 끝없이 만들 수 있어 워치온리(watch-only) 지갑이 가능해진다.
          </>
        }
      />

      <ExplainCard
        title="작은따옴표(')는 무슨 뜻일까? — 하드닝"
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
