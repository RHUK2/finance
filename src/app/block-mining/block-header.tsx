"use client";

import { useState } from "react";
import { Hash } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Pipeline } from "@/components/pipeline";
import {
  ControlSlider,
  ExplainCard,
  SectionIntro,
} from "@/components/simulation";
import {
  blockHeaderPrefix,
  hashWithNonce,
  SAMPLE_HEADER,
  type BlockHeader,
} from "@/lib/block-concept";
import { shortHex } from "@/lib/utils";

// SAMPLE_HEADER는 상수라 접두어도 한 번만 계산해 두면 된다.
const HEADER_PREFIX = blockHeaderPrefix(SAMPLE_HEADER);

export function BlockHeaderView() {
  const [nonce, setNonce] = useState(21);

  const header: BlockHeader = { ...SAMPLE_HEADER, nonce };
  const hash = hashWithNonce(HEADER_PREFIX, nonce);
  const prevHash = hashWithNonce(HEADER_PREFIX, nonce - 1);

  return (
    <div className="flex flex-col gap-4">
      <SectionIntro title="블록 헤더: 80바이트짜리 요약본">
        블록 하나에는 수천 개의 트랜잭션이 들어 있지만, 채굴자가 실제로 반복해서
        해시하는 대상은 그걸 80바이트로 압축한 <b>헤더</b>다. 이전 블록 해시로
        체인에 이어 붙고, 머클 루트로 그 안의 모든 트랜잭션을 대표하고, 나머지
        필드가 &#39;정답을 찾았다&#39;는 증거가 될 때까지 바뀐다.
      </SectionIntro>

      <Card className="flex flex-col gap-3 p-4">
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          <Hash className="size-4 text-amber-600 dark:text-amber-400" />
          헤더 필드 → 블록 해시
        </span>
        <Pipeline
          items={[
            {
              kind: "split",
              boxes: [
                { label: "version", value: header.version.toString(16) },
                {
                  label: "prevHash (이전 블록)",
                  value: shortHex(header.prevHash, 16),
                },
              ],
            },
            {
              kind: "split",
              boxes: [
                {
                  label: "merkleRoot (트랜잭션 대표값)",
                  value: shortHex(header.merkleRoot, 16),
                },
                { label: "timestamp", value: header.timestamp },
              ],
            },
            {
              kind: "split",
              boxes: [
                { label: "bits (난이도 목표)", value: header.bits },
                { label: "nonce", value: header.nonce, tone: "accent" },
              ],
            },
            { kind: "op", label: "SHA-256을 두 번 (SHA-256d)" },
            {
              kind: "box",
              label: "블록 해시",
              value: shortHex(hash, 24),
              tone: "good",
            },
          ]}
        />

        <div className="border-t pt-3">
          <ControlSlider
            label="nonce (채굴자가 바꾸는 값)"
            hint="다른 필드는 그대로 두고 nonce만 1 바꿔도 해시는 완전히 다른 값이 된다."
            value={nonce}
            onChange={setNonce}
            min={0}
            max={64}
            step={1}
            format={(v) => v.toString()}
          />
        </div>

        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          <div className="bg-muted flex flex-col gap-1 rounded-md p-3">
            <span className="text-muted-foreground text-xs">
              nonce {nonce - 1} → 해시
            </span>
            <code className="font-mono text-xs break-all">
              {shortHex(prevHash, 20)}
            </code>
          </div>
          <div className="bg-muted flex flex-col gap-1 rounded-md border border-amber-500/40 p-3">
            <span className="text-muted-foreground text-xs">
              nonce {nonce} → 해시
            </span>
            <code className="font-mono text-xs break-all">
              {shortHex(hash, 20)}
            </code>
          </div>
        </div>
      </Card>

      <ExplainCard
        title="왜 1만 바뀌어도 해시는 완전히 딴판일까"
        preview="암호 해시 함수의 눈사태 효과: 입력이 1비트만 달라져도 출력은 절반이 뒤집힌다."
        body={
          <>
            SHA-256 같은 암호 해시 함수는 입력이 한 비트만 달라져도 출력 비트의
            절반 가까이가 뒤집히도록 설계돼 있다(눈사태 효과). 그래서 위에서
            nonce를 1만 바꿔도 두 해시 사이에 어떤 규칙성이나 &#39;앞으로 갈수록
            목표에 가까워지는&#39; 패턴이 전혀 보이지 않는다. 목표를 맞는 해시를
            미리 계산하거나 예측할 방법이 없고, 오직 매번 새로 찍어서 확인하는
            수밖에 없다. 이 &#39;찍기 말고는 답이 없다&#39;는 성질이 다음 탭
            채굴 시뮬레이션의 전제가 된다.
          </>
        }
      />

      <ExplainCard
        title="채굴자가 바꿀 수 있는 건 nonce만이 아니다"
        preview="nonce가 4바이트를 다 써버리면 coinbase 트랜잭션의 extraNonce나 timestamp를 바꿔 머클 루트 자체를 새로 만든다."
        body={
          <>
            nonce는 4바이트(약 43억 가지)뿐이라 빠른 채굴기는 이걸 순식간에 다
            써버린다. 그러면 블록에 자기 몫으로 들어가는 coinbase
            트랜잭션(보상을 받는 트랜잭션) 안의 <b>extraNonce</b> 값을 바꾼다.
            이 트랜잭션이 바뀌면 그 트랜잭션들을 요약하는 <b>머클 루트</b>도
            통째로 바뀌므로, 사실상 시도할 수 있는 조합은 사실상 무한하다.
          </>
        }
      />
    </div>
  );
}
