"use client";

import { Dices, KeyRound, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExplainCard, Metric, SectionIntro } from "@/components/simulation";
import {
  checksumBits,
  ENTROPY_OPTIONS,
  entropyBreakdown,
  hexToBits,
  illustrativeSha256,
  type EntropyBits,
  type MnemonicWord,
} from "@/lib/bip-concept";

import { Pipeline } from "@/components/pipeline";

export function EntropyMnemonic({
  bits,
  entropyHex,
  words,
  onChangeBits,
  onRegen,
}: {
  bits: EntropyBits;
  entropyHex: string;
  words: MnemonicWord[];
  onChangeBits: (b: EntropyBits) => void;
  onRegen: () => void;
}) {
  const bd = entropyBreakdown(bits);
  const binaryGroups = hexToBits(entropyHex).match(/.{1,8}/g) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <SectionIntro title="엔트로피를 단어로 (BIP-39)">
        지갑의 출발점은 순수한 무작위 비트, 즉 엔트로피다. 이 비트열을 11비트씩 잘라
        각 조각(0~2047)을 2048개 단어장의 단어로 바꾼다. 강도를 바꿔 단어 수가 어떻게
        달라지는지, 🎲로 새 엔트로피를 뽑아 단어가 어떻게 바뀌는지 확인해 보자.
      </SectionIntro>

      <Card className="flex flex-col gap-4 p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">엔트로피 강도</span>
            <Select
              value={String(bits)}
              onValueChange={(v) => onChangeBits(Number(v) as EntropyBits)}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENTROPY_OPTIONS.map((b) => (
                  <SelectItem key={b} value={String(b)}>
                    {b} bit → {entropyBreakdown(b).words}단어
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={onRegen} className="gap-1.5">
            <Dices className="size-4" />
            새로 뽑기
          </Button>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground text-xs">엔트로피 (hex)</span>
          <code className="bg-muted text-foreground rounded-md p-3 font-mono text-xs break-all">
            {entropyHex}
          </code>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground text-xs">
            엔트로피 (2진수 · {bd.entropy}비트 = 동전 {bd.entropy}번 던지기)
          </span>
          <code className="bg-muted text-foreground rounded-md p-3 font-mono text-xs leading-relaxed break-words">
            {binaryGroups.join(" ")}
          </code>
        </div>
      </Card>

      <ExplainCard
        icon={<Dices className="size-4" />}
        title="이 숫자, 직접 던져서 만들 수도 있다 — 주사위·동전"
        body={
          <>
            엔트로피는 결국 무작위 0/1의 나열이다. 컴퓨터의 난수 생성기를 믿기
            어렵다면(악성코드·백도어가 예측 가능한 값을 심을 수 있다), 인터넷에 연결된 적
            없는 환경에서 <b>동전이나 주사위로 직접</b> 만들 수 있다. 동전 한 번 =
            1비트(앞 1, 뒤 0)라서 128비트 지갑은 동전 128번이면 충분하고, 주사위는 한 번에
            약 2.58비트라 256비트엔 99번만 굴리면 된다(콜드카드 방식). 사람 손으로 물리적
            세계에서 뽑은 무작위성은 누구도 예측하거나 가로챌 수 없어, 가장 신뢰할 수 있는
            출발점이 된다.
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="엔트로피 (ENT)" value={`${bd.entropy} bit`} />
        <Metric label="체크섬 (CS)" value={`${bd.checksum} bit`} sub="ENT ÷ 32" tone="accent" />
        <Metric label="총 비트" value={`${bd.total} bit`} sub="ENT + CS" />
        <Metric label="단어 수" value={`${bd.words}개`} sub="총 ÷ 11" tone="good" />
      </div>

      <Card className="flex flex-col gap-3 p-4">
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          <KeyRound className="size-4" />
          니모닉 단어
        </span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {words.map((w) => (
            <div
              key={w.position}
              className={
                "flex flex-col gap-0.5 rounded-md border p-2 " +
                (w.isChecksum ? "border-amber-500/50 bg-amber-500/5" : "")
              }
            >
              <span className="flex items-center justify-between">
                <span className="text-muted-foreground font-mono text-[10px]">
                  #{w.position}
                </span>
                {w.isChecksum && (
                  <Badge variant="outline" className="h-4 px-1 text-[9px]">
                    체크섬
                  </Badge>
                )}
              </span>
              <span className="font-mono text-sm font-medium">{w.word}</span>
              <span className="text-muted-foreground font-mono text-[10px] tabular-nums">
                {w.bits} = {w.index}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          <ShieldCheck className="size-4" />
          체크섬은 이렇게 만들어진다 (SHA-256)
        </span>
        <Pipeline
          items={[
            { kind: "box", label: "엔트로피 (입력)", value: entropyHex },
            { kind: "op", label: "SHA-256 해시" },
            {
              kind: "box",
              label: "해시 결과 (256비트)",
              value: illustrativeSha256(entropyHex),
            },
            { kind: "op", label: `앞 ${bd.checksum}비트만 잘라냄 (ENT ÷ 32)` },
            {
              kind: "box",
              label: "체크섬 → 마지막 단어 뒤에 붙음",
              value: checksumBits(entropyHex),
              tone: "accent",
            },
          ]}
        />
        <p className="text-muted-foreground text-xs">
          실제로는{" "}
          <code className="font-mono">crypto.subtle.digest(&quot;SHA-256&quot;, …)</code>
          로 계산한다. 이 데모는 의존성 없이 흐름만 보여주려고 해시·체크섬을 결정적
          가짜 값으로 채웠다.
        </p>
      </Card>

      <ExplainCard
        title="체크섬은 왜 필요할까?"
        body={
          <>
            복구할 때 지갑은 입력한 단어들에서 엔트로피를 거꾸로 뽑아 <b>SHA-256을 다시
            계산</b>하고, 끝에 붙은 체크섬과 맞는지 검사한다. 단어를 하나라도 잘못 적으면
            해시가 어긋나 즉시 &lsquo;잘못된 니모닉&rsquo; 오류가 뜬다. 그래서 아무 단어
            12개나 적는다고 유효한 니모닉이 되지 않는다.
          </>
        }
      />
    </div>
  );
}
