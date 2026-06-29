"use client";

import { Cog, Lock } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ExplainCard, SectionIntro } from "@/components/simulation";

import { Pipeline } from "@/components/pipeline";

export function SeedDerivation({
  mnemonic,
  passphrase,
  onPassphrase,
  seedHex,
}: {
  mnemonic: string;
  passphrase: string;
  onPassphrase: (v: string) => void;
  seedHex: string;
}) {
  const extraWordPosition = mnemonic.split(" ").length + 1;

  return (
    <div className="flex flex-col gap-4">
      <SectionIntro title="단어를 시드로 (BIP-39)">
        단어 목록 자체가 키는 아니다. 단어들을 선택적 passphrase와 함께 PBKDF2 함수에
        2048번 통과시켜 하나의 512비트 <b>시드</b>로 뭉친다. 이 시드가 모든 키의
        뿌리다. passphrase에 글자 하나만 더해도 시드 전체가 완전히 달라지는 걸 직접
        확인해 보자.
      </SectionIntro>

      <Card className="flex flex-col gap-1.5 p-4">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <Lock className="size-4" />
          passphrase (선택, {extraWordPosition}번째 단어)
        </span>
        <Input
          value={passphrase}
          onChange={(e) => onPassphrase(e.target.value)}
          placeholder="비워 두어도 됨 — 한 글자 바꿔 보세요"
        />
        <p className="text-muted-foreground text-xs">
          passphrase는 단어를 적어둔 종이를 누가 훔쳐도 자금을 지키는 추가 비밀이다.
          단, 잊으면 복구가 불가능하다.
        </p>
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          <Cog className="size-4" />
          시드는 이렇게 만들어진다 (PBKDF2)
        </span>
        <Pipeline
          items={[
            { kind: "box", label: "비밀번호 = 니모닉 단어들 (①에서 생성됨)", value: mnemonic },
            {
              kind: "box",
              label: "솔트 = \"mnemonic\" + passphrase",
              value: `"mnemonic"${passphrase ? ` + "${passphrase}"` : " (passphrase 없음)"}`,
            },
            { kind: "op", label: "PBKDF2-HMAC-SHA512 · 2048회 반복" },
            {
              kind: "box",
              label: "시드 (512비트, hex 128자)",
              value: seedHex,
              tone: "good",
            },
          ]}
        />
        <p className="text-muted-foreground text-xs">
          반복 횟수가 많을수록 무차별 대입이 느려진다. 이 데모의 시드는 흐름을 보여주는
          가짜 값이다.
        </p>
      </Card>

      <ExplainCard
        title="왜 글자 하나에 시드가 통째로 바뀔까? (눈사태 효과)"
        body={
          <>
            좋은 해시 함수는 입력이 1비트만 달라져도 출력이 절반쯤 무작위로 뒤집힌다.
            그래서 passphrase에 점(.) 하나만 더해도 완전히 다른 지갑이 된다. 같은 단어
            목록 + 다른 passphrase = 서로 무관한 지갑들 — 이를 이용해 &lsquo;위장
            지갑&rsquo;을 만들 수도 있다. (이 데모의 시드는 시연용 값이다.)
          </>
        }
      />

      <ExplainCard
        title="여기서 HMAC은 '인증'이 아니라 '믹서'다"
        body={
          <>
            HMAC 하면 보통 &lsquo;비밀 키로 메시지를 인증한다&rsquo;를 떠올린다 — 그땐 키가
            새면 위조되니 비밀성이 생명이다. 하지만 PBKDF2가 HMAC을 부르는 이유는 인증이
            아니라, 두 입력을 예측 불가능하게 잘 섞어 주는 <b>결정적 믹서(PRF)</b>가
            필요해서다. 니모닉은 HMAC의 &lsquo;키&rsquo; 자리에 들어가지만 그 비밀성 성질을
            쓰는 게 아니라 단지 시드의 재료일 뿐이다. 그래서 시드의 보안은 HMAC이 아니라
            ① <b>니모닉 자체의 엔트로피</b>(12단어 = 128비트)와 ② <b>2048회 반복으로 인한
            느림</b>에서 나온다. (니모닉은 종이에 적어 두더라도 당신만 아는 비밀이어야
            한다.)
          </>
        }
      />
    </div>
  );
}
