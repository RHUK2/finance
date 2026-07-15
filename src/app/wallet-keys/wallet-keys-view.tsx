"use client";

import { useMemo, useState } from "react";
import { TriangleAlert } from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { PageMain } from "@/components/page-main";
import { Card } from "@/components/ui/card";
import { ExplainCard, SimTabs } from "@/components/simulation";
import {
  entropyToMnemonic,
  illustrativeHex,
  mnemonicString,
  mnemonicToSeed,
  randomEntropyHex,
  type EntropyBits,
} from "@/lib/bip-concept";

import { EntropyMnemonic } from "./entropy-mnemonic";
import { KeyTree } from "./key-tree";
import { SeedDerivation } from "./seed-derivation";

export function WalletKeysView() {
  // 초기값은 결정적(서버·클라 동일) → 하이드레이션 불일치 방지. 재생성은 클라 이벤트에서만.
  const [entropyHex, setEntropyHex] = useState(() =>
    illustrativeHex("genesis", 32),
  );
  const [passphrase, setPassphrase] = useState("");
  // 비트 수는 엔트로피 길이에서 파생 (hex 1글자 = 4비트). 별도 state로 두면 어긋날 수 있다.
  const bits = (entropyHex.length * 4) as EntropyBits;

  const words = useMemo(() => entropyToMnemonic(entropyHex), [entropyHex]);
  const mnemonic = useMemo(() => mnemonicString(words), [words]);
  const seedHex = useMemo(
    () => mnemonicToSeed(mnemonic, passphrase),
    [mnemonic, passphrase],
  );

  function changeBits(b: EntropyBits) {
    setEntropyHex(randomEntropyHex(b));
  }

  const TABS = [
    {
      value: "mnemonic",
      label: "① 엔트로피 → 단어",
      node: (
        <EntropyMnemonic
          bits={bits}
          entropyHex={entropyHex}
          words={words}
          onChangeBits={changeBits}
          onRegen={() => setEntropyHex(randomEntropyHex(bits))}
        />
      ),
    },
    {
      value: "seed",
      label: "② 단어 → 시드",
      node: (
        <SeedDerivation
          mnemonic={mnemonic}
          passphrase={passphrase}
          onPassphrase={setPassphrase}
          seedHex={seedHex}
        />
      ),
    },
    {
      value: "tree",
      label: "③ 시드 → 키 트리",
      node: <KeyTree seedHex={seedHex} />,
    },
  ];

  return (
    <>
      <AppHeader breadcrumbs={[{ label: "지갑 키 생성" }]} />
      <PageMain>
        <div className="mx-auto flex max-w-5xl flex-col gap-4">
          <div>
            <h1 className="text-xl font-semibold">
              지갑은 어떻게 &#39;단어&#39;에서 만들어질까
            </h1>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              비트코인 지갑은 12~24개의 영어 단어 하나로 모든 주소와 키를
              복원한다. 그 비밀은 BIP-39와 BIP-32/44라는 규칙에 있다. 무작위
              동전 던지기(엔트로피)가 어떻게 단어가 되고, 그 단어가 어떻게
              시드가 되며, 하나의 시드에서 어떻게 수많은 주소가 가지치기되는지
              직접 만져보며 따라가 보자.
            </p>
          </div>

          <Card className="gap-2 border-amber-500/40 bg-amber-500/5 p-4 text-sm leading-relaxed">
            <span className="flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
              <TriangleAlert className="size-4" />
              교육용 개념 시연
            </span>
            <p className="text-muted-foreground">
              여기서 만들어지는 단어·시드·주소는 흐름을 보여주기 위한{" "}
              <b>그럴듯한 가짜 값</b>이다. 체크섬·시드·주소는 실제 암호
              연산(SHA-256, PBKDF2, secp256k1)을 단순화했다.{" "}
              <b>절대 실제 지갑이나 자금에 사용하지 말 것.</b>
            </p>
          </Card>

          <SimTabs tabs={TABS} defaultValue="mnemonic" />

          <ExplainCard
            title="SHA-256·SHA-512·HMAC·PBKDF2, 이름은 비슷한데 뭐가 다를까?"
            preview="세 단계에 걸쳐 등장하는 해시 계열 함수 넷, 목적이 서로 다르다."
            body={
              <>
                세 단계에 걸쳐 해시 계열 함수가 넷 등장하는데 목적이 서로
                다르다. <b>SHA-256</b>은 입력을 고정 256비트로 줄이는 순수
                해시다. 빠르고 단방향이라 ①의 체크섬을 비롯해 채굴·주소 생성에
                두루 쓴다. <b>SHA-512</b>는 같은 SHA-2 계열이지만 출력이 512비트로
                두 배다. ②의 시드 파생과 ③의 키 트리에 모두 쓰이는데, 특히
                ③에서는 그 512비트를 정확히 반으로 갈라 앞 256비트는 키 재료,
                뒤 256비트는 체인코드로 쓴다. 앞 절반이 곧바로 키가 되는 건
                마스터 단계뿐이고, 자식 단계에서는 그 값(IL)을 부모 개인키에
                더해야 자식 키가 된다.{" "}
                <b>HMAC</b>은 해시에 키를 끼워 넣어, 키를 아는 사람이
                만들었음을 증명하거나(인증) 두 입력을 잘 섞는 믹서로 쓴다.{" "}
                <b>PBKDF2</b>는 그 HMAC을 수천 번 반복해 <b>일부러 느리게</b>{" "}
                만든 키 유도 함수다. 그래서 ②에서 PBKDF2-HMAC-SHA512(시드),
                ③에서 HMAC-SHA512(키 트리)가 차례로 나온다.
              </>
            }
          />
        </div>
      </PageMain>
    </>
  );
}
