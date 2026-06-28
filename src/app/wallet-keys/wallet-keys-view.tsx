"use client";

import { useMemo, useState } from "react";
import { TriangleAlert } from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { PageMain } from "@/components/page-main";
import { Card } from "@/components/ui/card";
import { SimTabs } from "@/components/simulation";
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
  const [bits, setBits] = useState<EntropyBits>(128);
  // 초기값은 결정적(서버·클라 동일) → 하이드레이션 불일치 방지. 재생성은 클라 이벤트에서만.
  const [entropyHex, setEntropyHex] = useState(() => illustrativeHex("genesis", 32));
  const [passphrase, setPassphrase] = useState("");

  const words = useMemo(() => entropyToMnemonic(entropyHex), [entropyHex]);
  const mnemonic = useMemo(() => mnemonicString(words), [words]);
  const seedHex = useMemo(
    () => mnemonicToSeed(mnemonic, passphrase),
    [mnemonic, passphrase],
  );

  function changeBits(b: EntropyBits) {
    setBits(b);
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
              지갑은 어떻게 &lsquo;단어&rsquo;에서 만들어질까
            </h1>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              비트코인 지갑은 12~24개의 영어 단어 하나로 모든 주소와 키를 복원한다. 그
              비밀은 BIP-39와 BIP-32/44라는 규칙에 있다. 무작위 동전 던지기(엔트로피)가
              어떻게 단어가 되고, 그 단어가 어떻게 시드가 되며, 하나의 시드에서 어떻게
              수많은 주소가 가지치기되는지 직접 만져보며 따라가 보자.
            </p>
          </div>

          <Card className="border-amber-500/40 bg-amber-500/5 gap-2 p-4 text-sm leading-relaxed">
            <span className="flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
              <TriangleAlert className="size-4" />
              교육용 개념 시연
            </span>
            <p className="text-muted-foreground">
              여기서 만들어지는 단어·시드·주소는 흐름을 보여주기 위한{" "}
              <b>그럴듯한 가짜 값</b>이다. 체크섬·시드·주소는 실제 암호 연산(SHA-256,
              PBKDF2, secp256k1)을 단순화했다. <b>절대 실제 지갑이나 자금에 사용하지 말
              것.</b> 진짜 지갑은 오프라인에서 검증된 소프트웨어로만 생성해야 한다.
            </p>
          </Card>

          <Card className="gap-1.5 p-4 text-sm leading-relaxed">
            <span className="font-semibold">한 줄 정리</span>
            <ul className="text-muted-foreground list-disc space-y-1 pl-4">
              <li>
                <b>엔트로피 → 단어 (BIP-39)</b> — 무작위 비트를 11비트씩 잘라 2048개
                단어장에서 단어를 고른다. 그래서 단어 수가 12·15·18·21·24개로 정해진다.
              </li>
              <li>
                <b>단어 → 시드 (BIP-39)</b> — 단어들을 (선택적 passphrase와 함께) 한
                덩어리 512비트 시드로 변환한다. 글자 하나만 달라도 시드는 완전히 바뀐다.
              </li>
              <li>
                <b>시드 → 키 트리 (BIP-32/44)</b> — 하나의 시드에서{" "}
                <code className="font-mono">m/44&apos;/0&apos;/0&apos;/0/0</code> 같은
                경로를 따라 무한히 많은 주소를 가지치기한다.
              </li>
            </ul>
          </Card>

          <SimTabs tabs={TABS} defaultValue="mnemonic" />
        </div>
      </PageMain>
    </>
  );
}
