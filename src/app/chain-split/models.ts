// 체인 분기 페이지의 순수 계산 모델. 외부 API를 쓰지 않는다.
//
// 이 페이지의 축은 하나다. 리플레이가 성립하는지와 어느 방향으로 코인을 분리할 수
// 있는지를 오직 두 체인의 규칙 집합이 어떻게 겹치는지로만 결정한다. 서명 알고리즘
// 차이·체인 ID·SIGHASH 플래그는 모델에 넣지 않는다(docs/adr/0005 참조).

import { RETARGET_INTERVAL } from '@/lib/bitcoin-models';
import { clamp } from '@/lib/utils';

// 화면에 쓰는 사건 수치는 값과 기준 시점을 한 객체에 묶어 단일 출처로 둔다.
// 기준 없는 수치는 몇 달 뒤 조용히 틀린 문서가 된다.
export type Fact = { value: number; label: string; asOf: string; source: string };

export const FACTS = {
  signalingHeight: {
    value: 961_632,
    label: 'BIP-110 mandatory signaling 개시 블록',
    asOf: '2026년 8월 7일',
    source: 'BIP-110 배포 파라미터',
  },
  signalingShare: {
    value: 0.0253,
    label: '개시 직전 2,016블록의 BIP-110 신호 비율',
    asOf: '2026년 8월 7일',
    source: '블록 헤더 집계 (51 / 2,016)',
  },
  lockInThreshold: {
    value: 0.55,
    label: 'BIP-110 조기 활성화 임계값',
    asOf: '2026년 8월',
    source: 'BIP-110 배포 파라미터',
  },
  minorityBlocks: {
    value: 2,
    label: 'BIP-110 소수 체인이 채굴한 블록 수',
    asOf: '2026년 8월 9일 오후',
    source: '소수 체인 관측',
  },
  ecashHeight: {
    value: 964_000,
    label: 'eCash 하드포크 분기 블록',
    asOf: '2026년 8월 21일',
    source: 'eCash 제안 파라미터',
  },
} satisfies Record<string, Fact>;

// 기준일. 화면에 그대로 박아 이 페이지가 언제의 사실을 말하는지 남긴다.
export const AS_OF = '2026년 8월 25일';

// ─────────────────────────────────────────────────────────────
// 탭 1. 왜 두 체인이 남는가
//
// 소프트포크는 규칙을 좁히므로 구버전 노드가 신버전 블록을 계속 받아들인다.
// 그런데도 체인이 갈린 이유는 mandatory signaling에 있다. 신호하지 않는 블록을
// 좁은 쪽 노드가 거부하기 시작하면, 좁은 쪽은 다수 체인을 따라갈 수 없게 된다.
//
// 갈린 뒤 소수 체인이 어떻게 되는지는 난이도가 정한다. 난이도는 분기 시점의 값을
// 그대로 물려받고 다음 조정까지 2,016블록이 필요한데, 그 2,016블록을 줄어든
// 해시레이트로 캐야 한다. 아래 계산은 가상 눈금이 아니라 프로토콜 상수에서
// 그대로 나오는 값이다.
// ─────────────────────────────────────────────────────────────

export const TARGET_BLOCK_MINUTES = 10;

// 난이도 조정 주기는 프로토콜 상수라 bitcoin-models가 단일 출처다. 이 페이지의
// 화면 문구가 블록 수를 직접 부르므로 이름만 여기서 다시 내보낸다.
export { RETARGET_INTERVAL as RETARGET_BLOCKS };

// 해시레이트 비중(0~1)을 가진 체인의 평균 블록 간격(분).
export function blockIntervalMinutes(hashShare: number): number {
  return TARGET_BLOCK_MINUTES / clamp(hashShare, 0.0001, 1);
}

// 다음 난이도 조정까지 걸리는 시간(일). 조정 전까지는 난이도가 내려가지 않으므로
// 이 값이 소수 체인이 정상 속도를 되찾기까지 갇혀 있는 기간이 된다.
export function daysToRetarget(hashShare: number): number {
  return (blockIntervalMinutes(hashShare) * RETARGET_INTERVAL) / (60 * 24);
}

export function formatDuration(minutes: number): string {
  if (minutes < 90) return `${Math.round(minutes)}분`;
  if (minutes < 60 * 48) return `${(minutes / 60).toFixed(1)}시간`;
  return `${(minutes / (60 * 24)).toFixed(1)}일`;
}

// ─────────────────────────────────────────────────────────────
// 탭 2. 리플레이 공격
//
// 분기 유형이 규칙 집합의 모양을 정하고, 그 모양이 리플레이 성립 여부를 정한다.
//
//   소프트포크 분기: 좁은 규칙 ⊂ 넓은 규칙
//     평범한 송금은 좁은 규칙도 넓은 규칙도 만족하므로 양쪽 체인에서 유효하다.
//     포함 관계는 리플레이를 막지 못한다. 정하는 것은 분리 방향뿐이다
//     (좁은 쪽이 거부할 요소를 넣으면 넓은 쪽에서만 유효해진다. 탭 3).
//
//   하드포크 분기: 두 규칙이 서로를 포함하지 않음
//     그래도 과거와 서명 방식을 그대로 물려받으면 평범한 송금은 역시 양쪽에서
//     유효하다. 이 경우에만 리플레이 보호를 규칙에 넣어 끊을 수 있다.
//
// 소프트포크 분기에서 리플레이 보호가 불가능한 이유는 정의에 있다. 보호란 기존
// 체인에서 무효인 트랜잭션만 유효로 만드는 일이고, 그건 규칙을 넓히는 것이라
// 그 순간 소프트포크가 아니게 된다. 화면에서 이 컨트롤을 숨기지 않고 disabled로
// 두는 것은 그 사실 자체가 설명의 일부이기 때문이다.
// ─────────────────────────────────────────────────────────────

export type SplitKind = 'soft' | 'hard';

export const SPLIT_KINDS: { value: SplitKind; label: string }[] = [
  { value: 'soft', label: '소프트포크 분기' },
  { value: 'hard', label: '하드포크 분기' },
];

// 소프트포크 분기에는 리플레이 보호를 넣을 수 없다. 넣는 순간 규칙이 넓어져
// 하드포크가 된다.
export function protectionAvailable(kind: SplitKind): boolean {
  return kind === 'hard';
}

export function replayPossible(kind: SplitKind, protection: boolean): boolean {
  return !(protectionAvailable(kind) && protection);
}

export type ReplayStage = {
  title: string;
  narration: string;
  // 각 단계 종료 시점의 두 체인 잔고.
  main: number;
  forked: number;
};

export const START_BALANCE = 1;
export const SEND_AMOUNT = 0.3;

// 5단계 워크스루. 잔고는 단계마다 크게 점프하므로 화면에서는 StatCard로 그린다.
export function replayStages(kind: SplitKind, protection: boolean): ReplayStage[] {
  const soft = kind === 'soft';
  const replayed = replayPossible(kind, protection);
  const spent = START_BALANCE - SEND_AMOUNT;

  const forkNarration = soft
    ? '좁은 규칙을 강제하는 노드들이 다수 체인의 블록을 거부하면서 체인이 갈렸다. 분기 시점까지의 과거가 같으므로 같은 개인키가 양쪽 체인의 같은 잔고를 지배한다. 잔고가 둘로 늘어난 것처럼 보이지만, 늘어난 것은 잔고가 아니라 그 잔고를 잃을 경로다.'
    : '새 규칙을 담은 구현체가 분기 블록에서 갈라져 나오며 과거 장부를 그대로 복사했다. 보유자는 1 BTC마다 분기 코인 1개를 그대로 받는다. 여기까지는 공짜로 무언가 생긴 것처럼 보인다.';

  const replayNarration = replayed
    ? soft
      ? '서명된 트랜잭션은 브로드캐스트되는 순간 누구나 볼 수 있다. 누군가 그것을 그대로 복사해 반대편 체인에 던진다. 평범한 송금은 좁은 규칙도 넓은 규칙도 만족하므로 반대편에서도 그대로 유효하다. 개인키를 넘긴 적도, 어디가 뚫린 적도 없는데 반대편 잔고가 같이 나갔다.'
      : '서명된 트랜잭션은 브로드캐스트되는 순간 누구나 볼 수 있다. 두 체인이 같은 과거와 같은 서명 방식을 쓰므로, 복사해서 반대편에 던지면 그대로 유효하다. 개인키를 넘긴 적도, 어디가 뚫린 적도 없는데 반대편 잔고가 같이 나갔다.'
    : '리플레이 보호가 규칙에 들어가 있다. 한쪽 체인용으로 서명된 트랜잭션은 반대편 체인의 검증을 통과하지 못하고 그대로 거부된다. 복사해서 던져도 아무 일이 일어나지 않는다.';

  const verdictNarration = replayed
    ? `한 번의 서명으로 양쪽에서 ${SEND_AMOUNT} BTC씩, 합쳐서 ${(SEND_AMOUNT * 2).toFixed(1)} BTC가 나갔다. 받는 쪽 주소를 쥔 사람이 양쪽 체인에서 모두 받아 간다. ${
        soft
          ? '소프트포크 분기에서는 이 경로를 규칙으로 막을 수 없으므로, 트랜잭션을 짜는 쪽에서 끊어야 한다. 다음 탭이 그 방법이다.'
          : '하드포크 분기는 규칙으로 막을 수 있었는데 막지 않은 경우다.'
      }`
    : '보낸 쪽 체인에서만 잔고가 나갔다. 보유자가 아무것도 몰라도 결과가 안전한 유일한 경우이고, 그래서 리플레이 보호는 보유자가 아니라 분기를 만드는 쪽의 책임이다.';

  return [
    {
      title: '분기 직전',
      narration: `체인은 하나뿐이고 잔고도 하나다. 이 주소에 ${START_BALANCE} BTC가 있다. 여기서 서명한 트랜잭션이 갈 곳은 한 군데밖에 없다.`,
      main: START_BALANCE,
      forked: 0,
    },
    {
      title: '분기 발생',
      narration: forkNarration,
      main: START_BALANCE,
      forked: START_BALANCE,
    },
    {
      title: '한쪽 체인에서 송금',
      narration: `다수 체인에서 ${SEND_AMOUNT} BTC를 보낸다. 지갑은 평범한 송금 트랜잭션 하나를 만들어 서명하고 브로드캐스트한다. 여기까지는 분기와 아무 상관 없는 일상적인 동작이다.`,
      main: spent,
      forked: START_BALANCE,
    },
    {
      title: '반대편 체인에 복사 전송',
      narration: replayNarration,
      main: spent,
      forked: replayed ? spent : START_BALANCE,
    },
    {
      title: '결과',
      narration: verdictNarration,
      main: spent,
      forked: replayed ? spent : START_BALANCE,
    },
  ];
}

// ─────────────────────────────────────────────────────────────
// 탭 3. 코인 분리
//
// 리플레이를 끊는다는 것은 결국 한쪽 체인에서만 유효한 트랜잭션을 만드는 일이다.
// 방법은 유효성을 가르는 재료가 무엇이냐로 갈린다. 입력(UTXO)으로 가르거나,
// 규칙 차이로 가르거나, 서명 자체로 가른다.
// ─────────────────────────────────────────────────────────────

export type SeparationMethod = {
  id: string;
  label: string;
  sub: string;
  // [소프트포크 분기에서, 하드포크 분기에서, 개인이 직접 할 만한가]
  marks: ('yes' | 'no' | 'partial')[];
  body: string;
};

export const SEPARATION_METHODS: SeparationMethod[] = [
  {
    id: 'utxo',
    label: '분기 후 UTXO 섞기',
    sub: '한쪽에만 존재하는 입력을 끼워 넣는다',
    marks: ['yes', 'yes', 'partial'],
    body: '분기 이후에 채굴된 코인이나 분기 이후 거래소에서 출금한 코인은 한쪽 체인에만 존재한다. 이런 UTXO를 입력에 하나 섞어 트랜잭션을 만들면, 반대편 체인에는 그 입력 자체가 없으므로 복사해 던져도 검증을 통과하지 못한다. 두 분기 유형 어디서나 통하는 유일한 방법이고, 실제로 거래소가 분기 후 입출금을 재개하는 순서가 이 재료를 만들어 준다. 개인이 바로 쓰기 어려운 이유는 그 UTXO를 먼저 손에 넣어야 하고, 그러려면 이미 한 번 거래를 해야 하기 때문이다. 닭과 달걀이 걸린다.',
  },
  {
    id: 'rule',
    label: '한쪽 규칙만 위반하는 요소 붙이기',
    sub: '좁은 쪽이 거부할 데이터를 일부러 넣는다',
    marks: ['yes', 'partial', 'no'],
    body: 'BIP-110 체인은 OP_RETURN을 83바이트로 묶고 특정 데이터 푸시를 256바이트로 제한한다. 그 한도를 넘는 출력을 붙인 트랜잭션은 넓은 쪽 체인에서만 유효하다. 소프트포크 분기의 포함 관계가 여기서 처음으로 쓸모를 갖는다. 포함 관계는 리플레이를 막아 주지 않고, 어느 방향으로 분리할 수 있는지만 정해 준다. 좁은 쪽에서 넓은 쪽으로만 가능하고 반대는 안 된다. 하드포크 분기에서는 두 규칙이 서로를 포함하지 않아 양방향으로 가능해 보이지만, 실제로 쓰려면 두 구현체의 규칙 차이를 정확히 알아야 한다. 개인이 직접 하기는 어렵다. 지갑 소프트웨어가 만들어 주지 않는 모양의 트랜잭션을 손으로 조립해야 하고, 한 번 틀리면 되돌릴 수 없다.',
  },
  {
    id: 'protection',
    label: '리플레이 보호가 있는 체인',
    sub: '서명 자체가 반대편에서 무효가 된다',
    marks: ['no', 'yes', 'yes'],
    body: '분기를 만드는 쪽이 서명 대상에 체인을 식별하는 값을 섞어 두면, 한쪽 체인용 서명은 반대편 검증을 통과하지 못한다. 보유자가 아무것도 몰라도 안전해지므로 세 방법 중 유일하게 개인에게 부담이 없다. 대신 소프트포크 분기에서는 쓸 수 없다. 기존 체인에서 무효인 트랜잭션을 유효로 만드는 일이라 규칙이 넓어지고, 그 순간 소프트포크가 아니게 되기 때문이다. 그래서 이 방법의 유무는 보유자가 고를 수 있는 것이 아니라 분기 설계자가 이미 정해 놓은 조건이다.',
  },
];
