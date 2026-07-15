"use client";

import { useState } from "react";
import { ArrowDown, Eye, Lock, RotateCcw, StepForward } from "lucide-react";

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

// 페이지 전반(하드닝 배지·파이프라인 tone)과 같은 규칙: 잠김·비밀 = amber, 열림·공유 가능 = emerald.
const LOCK_COLOR = "text-amber-600 dark:text-amber-400";
const OPEN_COLOR = "text-emerald-600 dark:text-emerald-400";

function NodeRow({
  val,
  name,
  hint,
  current,
  revealed,
  onClick,
}: {
  val: string;
  name: string;
  hint: string;
  current: boolean;
  revealed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
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
      <span className="w-14 font-mono text-sm font-semibold">{val}</span>
      <span className="text-muted-foreground w-16 text-xs">{name}</span>
      <span className="text-muted-foreground truncate text-xs">{hint}</span>
    </button>
  );
}

export function KeyTree({ seedHex }: { seedHex: string }) {
  const [purpose, setPurpose] = useState("84");
  const [coin, setCoin] = useState("0");
  const [account, setAccount] = useState(0);
  const [change, setChange] = useState<0 | 1>(0);
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState(0); // 스텝다운: 지금까지 파생한 노드 인덱스

  const meta = PURPOSES.find((p) => p.value === purpose) ?? PURPOSES[0];
  const addressAt = (i: number) =>
    illustrativeAddress(
      seedHex,
      buildPath({ purpose, coin, account, change, index: i }),
      purpose,
    );
  const address = addressAt(index);

  // idx = 경로에 적히는 번호. 실제 CKD에 들어가는 직렬화 index는 하드닝이면 2^31 + idx다.
  const nodes = [
    {
      val: "m",
      name: "마스터",
      hint: "시드에서 나온 뿌리 키",
      hardened: false,
      idx: 0,
    },
    {
      val: `${purpose}'`,
      name: "purpose",
      hint: meta.addr,
      hardened: true,
      idx: Number(purpose),
    },
    {
      val: `${coin}'`,
      name: "coin",
      hint: coin === "0" ? "Bitcoin" : "Testnet",
      hardened: true,
      idx: Number(coin),
    },
    {
      val: `${account}'`,
      name: "account",
      hint: `${account}번 계정`,
      hardened: true,
      idx: account,
    },
    {
      val: `${change}`,
      name: "change",
      hint: change === 0 ? "수신용" : "잔돈용",
      hardened: false,
      idx: change,
    },
    {
      val: `${index}`,
      name: "index",
      hint: `${index}번 주소`,
      hardened: false,
      idx: index,
    },
  ];
  const lastStep = nodes.length - 1;
  const node = nodes[step];

  // 마지막(index) 단계는 형제 노드를 함께 펼쳐 '가지가 갈라지는' 모습을 보여준다.
  // 같은 부모(change)에서 나온 형제들이 서로 다른 주소로 이어지는 게 요점.
  const siblings = (
    index === 0 ? [0, 1, 2] : [index - 1, index, index + 1]
  ).map((i) => ({ index: i, address: addressAt(i) }));

  // 각 노드의 확장키 자료(개인키·체인코드·공개키). 모두 결정적 시연용 가짜 값.
  // HMAC-SHA512가 64바이트를 둘로 쪼갠다: 오른쪽 32B = 체인코드.
  // 왼쪽 32B는 마스터에선 개인키 그 자체, 자식 단계에선 부모 개인키에 더할 값(IL)이다.
  // 공개키는 02 + 32B (압축 33바이트) 모양.
  const keysAt = (i: number) => {
    const p = nodes
      .slice(0, i + 1)
      .map((n) => n.val)
      .join("/");
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

  // 하드닝은 별도 플래그가 아니라 index 공간을 반으로 가르는 규칙. 2^31 이상이면 하드닝.
  const serIndexHex =
    "0x" +
    (node.hardened ? 0x80000000 + node.idx : node.idx)
      .toString(16)
      .padStart(8, "0");

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
              {
                label: "마스터 체인코드 (오른쪽 32B)",
                value: cur.cc,
                tone: "accent",
              },
            ],
          },
        ]
      : [
          {
            kind: "box",
            // CKD가 받는 건 부모 확장키 전체지만, 그 두 조각은 갈라져 들어간다.
            // 체인코드는 아래 op의 HMAC 키로, 여기 상자는 데이터 쪽만 담는다.
            label: node.hardened
              ? `HMAC 입력 데이터 (0x00 + 부모 개인키 + index 2³¹+${node.idx})`
              : `HMAC 입력 데이터 (부모 공개키 + index ${node.idx})`,
            value: node.hardened
              ? `0x00 ∥ ${short(parent.priv)} ∥ ${serIndexHex}`
              : `${short(parent.pub)} ∥ ${serIndexHex}`,
          },
          {
            kind: "op",
            label: "HMAC-SHA512 (key = 부모 체인코드) → 64바이트를 둘로 분할",
          },
          {
            kind: "split",
            boxes: [
              { label: "IL · 더할 값 (왼쪽 32B)", value: cur.il },
              {
                label: "자식 체인코드 (오른쪽 32B)",
                value: cur.cc,
                tone: "accent",
              },
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
      {
        kind: "box",
        label: `주소 (${meta.addr})`,
        value: address,
        tone: "good",
      },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionIntro title="시드에서 키 트리로 (BIP-32 / 44)">
        하나의 시드에서 트리처럼 가지를 뻗어 무한히 많은 키를 만든다. 각 가지는{" "}
        <span className="font-mono">
          m / purpose&apos; / coin&apos; / account&apos; / change / index
        </span>{" "}
        경로로 지정한다. 아래 값을 바꿔 경로가 어떤 주소로 이어지는지 따라가
        보자.
      </SectionIntro>

      <ExplainCard
        title="쉽게 말하면: 씨앗 하나에서 매번 똑같이 자라는 나무"
        preview="시드를 심으면 나무가 자란다. 같은 씨앗이면 언제나 똑같은 나무, 똑같은 잎이다."
        body={
          <>
            시드는 씨앗이고, 심으면 나무 한 그루가 자란다고 생각하면 된다.
            가지는 중간 키, 끝에 달린 잎이 주소다. 신기한 건 이 나무가{" "}
            <b>매번 똑같이 자란다</b>는 점이다. 같은 씨앗이면 가지가 뻗는
            모양도, 잎이 달리는 순서도 언제나 같다. 그래서 백업할 게 씨앗
            하나뿐이다. 잎을 수천 장 따로 적어둘 필요가 없다. 지갑을 잃어버려도
            씨앗만 다시 심으면 똑같은 나무가 자라고 잎도 제자리에 돌아온다.
            <br />
            <br />
            <span className="font-mono">
              m / 84&apos; / 0&apos; / 0&apos; / 0 / 0
            </span>{" "}
            같은 경로는 그 나무에서 잎 하나를 찾아가는 길 안내다. 몸통에서 84번
            가지로, 거기서 0번 가지로, 이렇게 내려가면 늘 같은 잎이 나온다.
          </>
        }
      />

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
            onChange={(e) =>
              setAccount(Math.max(0, Number(e.target.value) || 0))
            }
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
          경로는 한 번에 나오지 않는다. 부모 키에서 가지 하나를 파생하면 나온
          자식 키가 다시 다음 가지의 부모가 된다. 각 노드는 확장 개인키(xprv)와
          확장 공개키(xpub)를 갖는데, 하드닝(&apos;)된 가지는 부모 개인키가
          있어야만 파생된다. 노드를 눌러 단계를 오갈 수 있다.
        </p>

        {/* 트리 지도 */}
        <ol className="flex flex-col">
          {nodes.map((n, i) => {
            const revealed = i <= step;
            const isLast = i === lastStep;
            return (
              <li key={i} className="flex flex-col">
                {i > 0 && (
                  // 트리의 세로 축은 노드 dot의 중심(x=19px: 버튼 border 1 + px-3 12 + dot 12/2).
                  // 화살표(14px)는 중심이 19에 오도록 pl-3(12px)에서 시작한다.
                  <div
                    className={cn(
                      "flex items-center gap-1.5 py-1 pl-3 text-xs",
                      revealed
                        ? "text-muted-foreground"
                        : "text-muted-foreground/40",
                    )}
                  >
                    <ArrowDown className="size-3.5 shrink-0" />
                    {n.hardened ? (
                      <Lock
                        className={cn(
                          "size-3 shrink-0",
                          LOCK_COLOR,
                          !revealed && "opacity-40",
                        )}
                      />
                    ) : (
                      <Eye
                        className={cn(
                          "size-3 shrink-0",
                          OPEN_COLOR,
                          !revealed && "opacity-40",
                        )}
                      />
                    )}
                    {n.hardened
                      ? `CKD ${n.val} · 하드닝 (부모 개인키 필요)`
                      : isLast
                        ? "CKD 0, 1, 2 … · 같은 부모에서 갈라지는 형제 가지들"
                        : `CKD ${n.val} · 일반 (부모 공개키로 충분)`}
                  </div>
                )}
                {isLast ? (
                  // 형제들을 줄기 선에 매달아 '한 부모에서 갈라진다'를 눈에 보이게 한다.
                  // 줄기 선(2px)도 중심이 축(19px)에 오도록 18px에서 시작한다.
                  <div
                    className={cn(
                      "ml-[18px] flex flex-col gap-0.5 border-l-2 pl-3",
                      revealed
                        ? "border-muted-foreground/30"
                        : "border-muted-foreground/10",
                    )}
                  >
                    {siblings.map((s) => (
                      <NodeRow
                        key={s.index}
                        val={`${s.index}`}
                        name="index"
                        hint={s.address}
                        current={step === lastStep && s.index === index}
                        revealed={revealed}
                        onClick={() => {
                          setIndex(s.index);
                          setStep(lastStep);
                        }}
                      />
                    ))}
                    <span
                      className={cn(
                        "px-3 py-1 text-xs",
                        revealed
                          ? "text-muted-foreground"
                          : "text-muted-foreground/40",
                      )}
                    >
                      … 이렇게 약 21억 개의 형제 주소가 이어진다. 시드 하나면
                      전부 되살아난다.
                    </span>
                  </div>
                ) : (
                  <NodeRow
                    val={n.val}
                    name={n.name}
                    hint={n.hint}
                    current={i === step}
                    revealed={revealed}
                    onClick={() => setStep(i)}
                  />
                )}
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
                    ? `bg-amber-500/10 ${LOCK_COLOR}`
                    : `bg-emerald-500/10 ${OPEN_COLOR}`,
                )}
              >
                {node.hardened ? (
                  <Lock className="size-3 shrink-0" />
                ) : (
                  <Eye className="size-3 shrink-0" />
                )}
                {node.hardened
                  ? "하드닝 · 부모 개인키 필요"
                  : "일반 · 부모 공개키로 충분"}
              </span>
            )}
          </div>

          <Pipeline items={detailItems} />

          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs leading-relaxed">
              방금 나온 개인키와 체인코드를 한 덩어리로 묶은 게 이 노드의
              확장키다. 다음 가지는 여기서 뻗는다.
            </span>
            <div className="bg-muted flex flex-col gap-0.5 rounded-md p-2.5">
              <span className="flex items-center gap-1 text-xs font-semibold">
                <Lock className={cn("size-3 shrink-0", LOCK_COLOR)} />
                확장 개인키 (xprv)
              </span>
              <code className="font-mono text-[11px] break-all">
                {short(cur.priv)} ∥ {short(cur.cc)}
              </code>
              <span className="text-muted-foreground text-[10px]">
                개인키 + 체인코드 · 비밀
              </span>
            </div>
            {/* 축은 xprv/xpub 카드 안 아이콘의 중심(x=16px: p-2.5 10 + 아이콘 12/2). */}
            <div className="text-muted-foreground flex items-center gap-1.5 pl-[9px] text-[10px]">
              <ArrowDown className="size-3.5 shrink-0" />
              개인키에만 secp256k1 적용 → 공개키, 체인코드는 그대로 복사
            </div>
            <div className="bg-muted flex flex-col gap-0.5 rounded-md p-2.5">
              <span className="flex items-center gap-1 text-xs font-semibold">
                <Eye className={cn("size-3 shrink-0", OPEN_COLOR)} />
                확장 공개키 (xpub)
              </span>
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
              ? "시드에서 나온 뿌리 키. 지갑의 모든 가지가 결국 이 한 노드에서 갈라져 나온다."
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
        title="체인코드는 뭐고 왜 계속 따라다닐까?"
        preview="키와 짝을 이루는 32바이트. 키가 아니라 '가지를 뻗는 방향'을 정하는 비밀 재료다."
        body={
          <>
            위 파이프라인의 모든 단계에서 키 옆에 32바이트짜리 <b>체인코드</b>가
            따라붙는다. 개인키에도 공개키에도, 그것도 <b>똑같은 값</b>이 붙는다.
            xprv는 <span className="font-mono">개인키 ∥ 체인코드</span>, xpub은{" "}
            <span className="font-mono">공개키 ∥ 체인코드</span>인데 두
            체인코드는 같다. 파생할 때 개인키에만 secp256k1을 적용해 공개키를
            만들고 체인코드는 그대로 복사하기 때문이다.
            <br />
            <br />
            체인코드는 키가 아니다. 서명에도, 주소를 만드는 데도 쓰이지 않는다.
            오직 자식을 파생할 때 HMAC의 키 자리에 들어가, 같은 부모에서{" "}
            <b>어느 방향으로 가지를 뻗을지</b>를 정하는 재료다.
            <br />
            <br />왜 굳이 이런 게 필요할까? 만약 부모 공개키와 index만으로
            자식이 정해진다면, 누군가 내 공개키 하나만 알아도 내 모든 주소를
            계산해 낼 수 있다. 지갑 전체가 공개되는 셈이다. 체인코드는
            비밀이라서, 이 32바이트를 함께 가진 사람만 가지를 뻗을 수 있다.
            그래서 확장키는 항상{" "}
            <span className="font-mono">키 ∥ 체인코드</span> 짝으로 다닌다.
            <br />
            <br />
            뒤집어 말하면 xpub(공개키 + 체인코드)을 남에게 주는 건 &#39;내
            자금을 쓸 권한&#39;이 아니라 &#39;내 모든 주소를 들여다볼
            권한&#39;을 주는 것이다. 돈은 못 훔쳐도 거래 내역은 전부 보인다.
          </>
        }
      />

      <ExplainCard
        title="개인키는 결국 그냥 256비트 난수일까?"
        preview="맞다. 다만 지갑의 실제 강도는 키 길이가 아니라 맨 처음 뽑은 엔트로피가 정한다."
        body={
          <>
            맞다. secp256k1 개인키는 <b>정수 하나</b>가 전부다. 조건은 1 이상{" "}
            <span className="font-mono">n</span> 미만이라는 것뿐인데, 이 n(곡선
            군의 위수)은 약 1.158 × 10<sup>77</sup>로 2<sup>256</sup>에 거의
            붙어 있다. 그래서 무작위 256비트 값을 뽑았을 때 범위를 벗어날 확률은
            대략 2<sup>-128</sup>, 실무에서는 일어나지 않는다고 봐도 되는
            수준이다. &#39;256비트 난수를 뽑으면 그게 개인키&#39;라고 해도
            틀리지 않는다.
            <br />
            <br />
            이건 은근히 특이한 성질이다. RSA는 키를 만들려면 큰 소수를 찾아야
            하고 아무 숫자나 골라서는 키가 안 된다. 반면 타원곡선 개인키는{" "}
            <b>아무 구조도 요구하지 않는다</b>. 그냥 숫자다. 그 숫자만큼 생성점
            G를 곱한 결과가 공개키일 뿐이고, 보안은 어떤 수학적 구조가 아니라
            순전히 &#39;이 숫자를 남이 못 맞힌다&#39;에서만 나온다.
            <br />
            <br />
            단, 여기에 중요한 단서가 붙는다. HD 지갑의 개인키는{" "}
            <b>매번 새로 뽑은 난수가 아니다.</b> 위에서 봤듯 시드에서 결정적으로
            파생된 값이라, 겉모습은 256비트짜리 무작위 숫자지만 실제 무작위성은
            시드에 묶여 있다. ①에서 12단어를 골랐다면 뿌리의 진짜 엔트로피는
            128비트뿐이고, 이 트리에 달린 주소 수십억 개의 개인키가 전부 그
            128비트에서 늘여낸 것이다. 공격자는 256비트 키를 깨려 들 필요 없이
            128비트짜리 시드만 노리면 된다.
            <br />
            <br />
            그래서 &#39;개인키는 256비트 난수&#39;는 키 하나만 놓고 보면 맞고,
            지갑 전체를 놓고 보면 오해를 부른다. 강도를 정하는 건 키의 길이가
            아니라 <b>맨 처음 동전을 몇 번 던졌느냐</b>다.
          </>
        }
      />

      <ExplainCard
        title="작은따옴표(')는 무슨 뜻일까? (하드닝)"
        preview="일반 파생에는 자식 키 하나가 새면 부모 키까지 역산되는 구멍이 있다. 하드닝은 그 고리를 끊는다."
        body={
          <>
            <span className="font-mono">44&apos;</span>처럼 붙은 따옴표는{" "}
            <b>하드닝(hardened)</b> 표시다. 사실 하드닝은 따로 붙는 플래그가
            아니라 <b>index 공간을 반으로 나눠 쓰는 규칙</b>이다. 0 이상 2
            <sup>31</sup> 미만이면 일반 가지, 2<sup>31</sup> 이상이면 하드닝된
            가지다. 그래서 따옴표는 &#39;이 번호에 2<sup>31</sup>을
            더하라&#39;는 뜻이고, <span className="font-mono">44&apos;</span>는
            실제로는 index 2<sup>31</sup>+44 ={" "}
            <span className="font-mono">0x8000002c</span>로 계산된다. 위 HMAC
            입력 데이터 상자에 찍히는 값이 바로 그것이다. 일반 가지가 약 21억
            개(2<sup>31</sup>)까지인 것도 나머지 절반을 하드닝이 가져갔기
            때문이다.
            <br />
            <br />
            그럼 왜 이렇게 반을 떼어 주면서까지 하드닝이 필요할까? 일반 파생의
            허점을 봐야 이해된다.
            <br />
            <br />위 파이프라인에서 봤듯 일반 파생은{" "}
            <span className="font-mono">
              자식 개인키 = (IL + 부모 개인키) mod n
            </span>
            이고, 이때 IL은 부모 <b>공개</b>키와 체인코드, 그리고 index로
            만든다. 앞의 둘은 xpub 안에 그대로 들어 있고 index는 그냥 고르는
            번호다. 즉 <b>xpub을 가진 사람은 IL을 직접 계산할 수 있다.</b> 그럼
            이런 일이 벌어진다. 그 사람이 자식 개인키 하나를 어쩌다 손에 넣으면,
            식을 뒤집어{" "}
            <span className="font-mono">
              부모 개인키 = (자식 개인키 − IL) mod n
            </span>
            으로 부모를 복원한다. 부모가 뚫리면 그 아래 형제 전부가 함께 뚫린다.
            주소 하나가 샜을 뿐인데 계정 전체를 잃는 것이다.
            <br />
            <br />
            하드닝은 이 고리를 끊는다. IL을 만들 때 부모 공개키 대신{" "}
            <b>부모 개인키</b>를 넣기 때문에, xpub만 가진 사람은 IL 자체를 구할
            수 없고 따라서 역산도 못 한다. 자식이 새도 부모는 안전하다.
            <br />
            <br />
            단, 방향을 헷갈리면 안 된다. 하드닝이 막는 건{" "}
            <b>아래에서 위로 올라오는 역산</b>뿐이다. 반대로 부모 xprv 자체가
            새면 하드닝이든 아니든 그 아래 모든 가지가 함께 뚫린다. 파생은 부모
            개인키만 있으면 어느 쪽이든 다 되기 때문이다. 그러니 하드닝은 시드나
            상위 xprv를 지켜 주는 장치가 아니라, 이미 새어 나간 하위 키의 피해가
            위로 번지지 않게 가두는 장치다.
            <br />
            <br />
            그래서 배치가 이렇게 갈린다. purpose·coin·account 같은 상위 단계는
            뚫렸을 때 잃을 게 크니 하드닝하고, change·index는 하드닝하지 않는다.
            덕분에 account 수준의 xpub 하나만 넘겨주면 watch-only 지갑이 개인키
            없이도 주소를 얼마든지 뽑을 수 있다. 안전한 지점까지만 잠그고, 그
            아래는 편의를 택한 절충이다. (이 데모의 주소는 시연용 값이다.)
          </>
        }
      />
    </div>
  );
}
