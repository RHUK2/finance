// 릴리스 검증 페이지 전용. 다른 페이지가 쓰지 않으므로 여기 둔다(CLAUDE.md
// "설명 페이지의 모델 배치").
//
// 이 저장소의 다른 models.ts는 전부 동기 순수 계산인데 여기만 async다. 브라우저가
// 실제로 계산하기 때문이다. 이 페이지의 체크섬과 서명은 그럴듯한 가짜가 아니라
// 작은 진짜라(ADR 0007), 독자가 글자 하나를 바꾸면 값이 실제로 뒤집혀야 한다.
// 그래서 illustrativeHex 같은 흉내가 아니라 WebCrypto를 그대로 부른다.
//
// 대신 실제 프로젝트의 공개키 지문과 복사해 실행할 검증 명령은 어디에도 없다
// (ADR 0009). 화면에 뜨는 지문은 전부 이 파일이 그 자리에서 만든 일회용 키의
// 것이거나 형태만 보이는 자리표시자다.

import { Building2, Cpu, HardDrive, KeyRound, Server, Store, type LucideIcon } from 'lucide-react';

import type { MarkRow } from '@/components/simulation';

/* ── 체크섬 ─────────────────────────────────────────────── */

const encoder = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** 진짜 SHA-256. 브라우저가 계산한다. */
export async function sha256Hex(text: string): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', encoder.encode(text)));
}

/** 16진수 문자열을 네 글자씩 끊어 지문처럼 보이게 한다. */
export function groupHex(hex: string, size = 4): string {
  return (hex.match(new RegExp(`.{1,${size}}`, 'g')) ?? []).join(' ');
}

/** 두 16진수 문자열에서 서로 다른 자리의 인덱스 집합. 눈사태 효과를 칠하는 데 쓴다. */
export function diffPositions(a: string, b: string): boolean[] {
  return Array.from(a, (ch, i) => ch !== b[i]);
}

/* ── 릴리스 서명 ────────────────────────────────────────── */

// GPG가 흔히 쓰는 Ed25519를 먼저 시도하고, 브라우저가 못 하면 어디서나 되는
// ECDSA P-256으로 내려온다. 화면에 어느 쪽으로 돌았는지를 적는 것이 중요하다.
// 알고리즘이 바뀌어도 이 탭의 결론이 한 글자도 달라지지 않는다는 사실이,
// 서명이 "어떤 도구냐"가 아니라 "누구 키냐"의 문제라는 이 탭의 논지 그 자체다.
export type SignAlgo = 'Ed25519' | 'ECDSA P-256';

export type SigningKey = {
  algo: SignAlgo;
  pair: CryptoKeyPair;
  /** 공개키의 SHA-256. 실제 GPG 지문 계산과는 다르지만 역할은 같다. */
  fingerprint: string;
};

function signParams(algo: SignAlgo): Algorithm | EcdsaParams {
  return algo === 'Ed25519' ? { name: 'Ed25519' } : { name: 'ECDSA', hash: 'SHA-256' };
}

export async function generateSigningKey(): Promise<SigningKey> {
  let algo: SignAlgo = 'Ed25519';
  let pair: CryptoKeyPair;
  try {
    pair = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])) as CryptoKeyPair;
  } catch {
    algo = 'ECDSA P-256';
    pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  }
  const raw = await crypto.subtle.exportKey('raw', pair.publicKey);
  return { algo, pair, fingerprint: (await sha256Hex(toHex(raw))).slice(0, 32) };
}

export async function signText(key: SigningKey, text: string): Promise<ArrayBuffer> {
  return crypto.subtle.sign(signParams(key.algo), key.pair.privateKey, encoder.encode(text));
}

export async function verifyText(key: SigningKey, sig: ArrayBuffer, text: string): Promise<boolean> {
  return crypto.subtle.verify(signParams(key.algo), key.pair.publicKey, sig, encoder.encode(text));
}

/** 서명 앞머리만 보여 줄 때 쓴다. 전부 적어도 읽히지 않는다. */
export function sigPreview(sig: ArrayBuffer): string {
  return groupHex(toHex(sig).slice(0, 32));
}

/* ── 공격자의 시점 ──────────────────────────────────────── */

export const ATTACK_HEADERS: [string, ...string[]] = [
  '공격자가 장악한 곳',
  '체크섬',
  '릴리스 서명',
  '채널 대조',
  '재현 기록',
];

export const ATTACK_ROWS: (MarkRow & { icon: LucideIcon })[] = [
  {
    id: 'web',
    label: '배포 웹서버',
    sub: '파일과 체크섬을 함께 교체',
    icon: Server,
    marks: ['no', 'yes', 'yes', 'yes'],
  },
  {
    id: 'mirror',
    label: '미러·CDN',
    sub: '중간 배포처만 교체',
    icon: HardDrive,
    marks: ['partial', 'yes', 'yes', 'yes'],
  },
  { id: 'key', label: '개발자 개인키', sub: '유효한 서명을 붙인다', icon: KeyRound, marks: ['no', 'no', 'no', 'yes'] },
  { id: 'ci', label: '빌드 서버', sub: '소스는 깨끗하고 산출물만 다르다', icon: Cpu, marks: ['no', 'no', 'no', 'yes'] },
  { id: 'dev', label: '개발자 본인 PC', sub: '소스에 들어간다', icon: Building2, marks: ['no', 'no', 'no', 'no'] },
  {
    id: 'fake',
    label: '가짜 배포처',
    sub: '프로젝트가 배포하지 않는 곳',
    icon: Store,
    marks: ['no', 'no', 'no', 'no'],
  },
];

export const ATTACK_DETAIL: Record<string, { title: string; body: string }> = {
  web: {
    title: '체크섬만 대조하면 그대로 통과한다',
    body: '체크섬 목록은 대개 바이너리 바로 옆에 놓인다. 서버를 쥔 쪽은 파일을 바꾸고 그 파일의 체크섬을 다시 계산해 목록도 같이 고쳐 둘 수 있다. 독자가 성실하게 대조해도 두 값은 완벽히 맞는다. 체크섬이 잡는 것은 전송 중에 깨진 비트이지, 양쪽을 다 만질 수 있는 상대가 아니다. 서명이 여기서부터 일을 시작한다.',
  },
  mirror: {
    title: '체크섬을 어디서 받았는지가 갈린다',
    body: '바이너리는 미러에서, 체크섬 목록은 원 사이트에서 받았다면 이 공격은 체크섬 단계에서 걸린다. 둘 다 같은 미러에서 받았다면 앞 줄과 똑같아진다. 같은 검증 수단이 상황에 따라 막기도 하고 못 막기도 한다는 뜻이고, 그래서 이 표의 칸은 도구의 성능이 아니라 그 도구를 어떻게 쓰느냐를 잰다.',
  },
  key: {
    title: '서명은 유효한데 파일은 가짜다',
    body: '개인키를 쥔 쪽은 자기가 만든 파일에 진짜 서명을 붙일 수 있다. 검증은 통과하고, 지문을 아무리 여러 채널에서 대조해도 그 키가 맞는 키이므로 통과한다. 이 줄에서 서명과 채널 대조가 동시에 무너지는 것이 재현 가능한 빌드가 존재하는 이유다. 소스에 없는 것이 바이너리에 들어 있으면 독립 빌더가 만든 결과와 바이트가 어긋난다.',
  },
  ci: {
    title: '앞 줄과 같은 자리에서 멈춘다',
    body: '빌드 서버가 소스를 그대로 받아 오염된 산출물을 내놓으면 서명은 정상 절차로 붙는다. 앞 줄과 마크가 똑같은 것이 요점이다. 공격 경로가 달라도 방어선은 같은 곳에 서 있다. 다만 독립 빌더 전부가 감염된 같은 툴체인을 쓴다면 이 줄의 마지막 칸도 무너지므로, 재현 기록이 값하려면 빌더의 환경이 실제로 서로 달라야 한다.',
  },
  dev: {
    title: '여기서 검증은 끝난다',
    body: '백도어가 소스 자체에 들어가 있으면 바이너리는 소스와 정확히 일치한다. 재현 가능한 빌드는 통과한다. 그게 정확히 재현 가능한 빌드가 보증하는 바이기 때문이다. 이 줄을 막는 것은 암호가 아니라 코드 리뷰와 기여자의 평판이고, 둘 다 이 페이지가 다루는 종류의 검증이 아니다. 못 막는 칸이 있다는 사실을 표에 그대로 둔 이유가 이것이다.',
  },
  fake: {
    title: '검증할 원본이 없다',
    body: '어떤 프로젝트가 특정 플랫폼에 아예 배포를 하지 않는데 그 플랫폼에 같은 이름의 앱이 올라와 있는 경우다. 실제로 일어난 일이고, 피해자들이 체크섬을 게을리했기 때문이 아니다. 대조할 원본이 존재한 적이 없다. 이 줄을 막는 유일한 질문은 앞선 어떤 검증보다 앞에 있다. 그 프로젝트가 여기에 배포를 하기는 하는가.',
  },
};

/* ── 네 도구 비교 ───────────────────────────────────────── */

export const TOOL_HEADERS: [string, ...string[]] = [
  '도구',
  '키 출처 분리',
  '서명자 다수',
  '독립 재현 기록',
  '신뢰 이월',
];

export const TOOL_ROWS: MarkRow[] = [
  { id: 'sparrow', label: 'Sparrow', sub: '데스크탑 앱', marks: ['yes', 'no', 'partial', 'yes'] },
  { id: 'seedsigner', label: 'SeedSigner', sub: 'OS 이미지', marks: ['no', 'no', 'no', 'no'] },
  { id: 'krux', label: 'Krux', sub: '기기 펌웨어', marks: ['no', 'no', 'no', 'yes'] },
  { id: 'core', label: 'Bitcoin Core', sub: '풀노드 실행 파일', marks: ['yes', 'yes', 'yes', 'no'] },
];

export const TOOL_DETAIL: Record<string, { title: string; body: string }> = {
  sparrow: {
    title: '키는 여러 곳에 있고 서명자는 하나다',
    body: '공개키를 배포 사이트와 코드 저장소와 신원 증명 서비스 세 곳에서 얻을 수 있어 키 출처가 바이너리와 분리돼 있다. 다만 그 셋이 모두 같은 한 사람으로 모이므로 서명자는 여전히 하나다. 재현 가능한 빌드는 압축 아카이브까지만 되고 설치 패키지와 서명된 macOS 바이너리는 재현되지 않으며, 독립 빌더의 결과가 쌓이는 곳도 서명 저장소가 아니라 빌드 과정을 촬영해 올리는 비암호학적 채널이다. 대신 이미 설치된 구버전이 새 릴리스의 서명을 확인해 주므로 신뢰 이월이 된다.',
  },
  seedsigner: {
    title: '네 칸이 비어 있는 것은 설계가 아니라 규모다',
    body: '공개키가 코드 저장소 안에 파일로 들어 있고 바이너리도 같은 플랫폼에서 나오므로 키 출처가 분리돼 있지 않다. 서명자는 하나고 독립 재현 기록도 공개된 곳이 없다. 이 소프트웨어는 사용자가 따로 구한 라즈베리파이에 구워 넣는 부팅 이미지이고, 부팅할 때 자기 서명을 확인하는 절차를 두지 않았다. 그래서 검증은 전부 PC에서, 카드를 굽기 전에 끝나야 한다. 다만 이것이 곧 약하다는 뜻은 아니다. 재현 가능한 빌드 자체는 되고, 이미지가 작아 다시 굽는 비용이 거의 없으며, SD카드 한 장이 신뢰 경계 전부라는 사실을 프로젝트가 숨기지 않고 설명한다.',
  },
  krux: {
    title: '기기가 다음 펌웨어를 스스로 검증한다',
    body: '키 출처와 서명자 수는 앞 줄과 같은 처지다. 갈리는 것은 마지막 칸이고, 그것을 하는 주체가 하드웨어가 아니라 이미 깔려 있는 펌웨어라는 점이 중요하다. 지금 돌고 있는 펌웨어가 SD카드에 올려 둔 다음 펌웨어의 서명을 스스로 확인하고, 유효할 때만 설치를 제안한다. PC에서 검증해야 하는 것은 첫 설치 한 번뿐이다. 릴리스 서명이 GPG가 아니라 비트코인과 같은 곡선으로 되어 있고 그 서명을 Krux 기기로 만든다는 점도 여기서 나온다. 기기 자체의 변조를 잡으려는 별도 장치도 있지만, 그것은 지금 돌고 있는 펌웨어가 정상일 때만 의미가 있어 신뢰 이월의 첫 칸 문제를 없애지는 못한다.',
  },
  core: {
    title: '혼자 서명하지 않는 유일한 쪽',
    body: '체크섬 목록 하나에 여러 사람의 독립 서명이 붙고, 동봉된 검증 도구는 유효한 서명이 몇 개 이상일 때만 통과시킬지를 사용자가 정하게 한다. 그 서명들이 나오는 근거가 독립 재현 기록이다. 서로 다른 사람이 같은 소스에서 빌드해 같은 바이트를 얻었다는 사실이 공개 저장소에 회차마다 쌓인다. 빌더의 공개키도 배포 사이트가 아니라 별도 저장소와 공개 키서버에 있어 출처가 갈라져 있다. 신뢰 이월이 없는 것은 결함이 아니라 필요가 없어서다. 검증을 이월할 대상이 아니라 매 회차 여러 사람의 서명을 세는 쪽을 골랐다.',
  },
};

/* ── 공개키를 받는 곳 ───────────────────────────────────── */

export const CHANNEL_HEADERS: [string, ...string[]] = [
  '공개키를 받는 곳',
  '배포처와 다른가',
  '기록이 남는가',
  '제3자가 본다',
];

export const CHANNEL_ROWS: MarkRow[] = [
  { id: 'site', label: '다운로드 페이지', sub: '가장 흔한 경로', marks: ['no', 'no', 'no'] },
  { id: 'repo', label: '프로젝트 코드 저장소', sub: '저장소 안의 키 파일', marks: ['partial', 'yes', 'partial'] },
  { id: 'keyserver', label: '공개 키서버', sub: '누구나 조회 가능', marks: ['yes', 'yes', 'partial'] },
  {
    id: 'social',
    label: '신원 증명 서비스·소셜 계정',
    sub: '계정과 키를 서로 묶어 둔 것',
    marks: ['yes', 'yes', 'yes'],
  },
  { id: 'offline', label: '대면·인쇄물', sub: '컨퍼런스, 책', marks: ['yes', 'no', 'partial'] },
];

export const CHANNEL_DETAIL: Record<string, { title: string; body: string }> = {
  site: {
    title: '이것만으로는 아무것도 확인되지 않는다',
    body: '파일을 준 곳에서 그 파일을 검증할 키까지 받으면, 그 서버를 쥔 쪽은 둘을 함께 바꾸면 그만이다. 절차는 전부 통과하고 결과는 아무것도 말해 주지 않는다. 그런데도 거의 모든 안내 문서가 이 경로를 첫 줄에 적는다. 편해서다. 다른 채널로 한 번 대조하기 전까지 이 경로는 검증이 아니라 검증의 흉내다.',
  },
  repo: {
    title: '분리된 것처럼 보이지만 플랫폼은 하나다',
    body: '코드 저장소에 공개키 파일을 두면 배포 사이트와는 주소가 갈린다. 다만 사이트가 그 저장소의 페이지 기능으로 만들어져 있고 릴리스 파일도 같은 저장소에 올라와 있다면, 갈린 것은 주소뿐이고 그 계정을 쥔 쪽에게는 전부 한 곳이다. 대신 저장소는 이력이 남아 키 파일이 언제 어떻게 바뀌었는지를 나중에 따질 수 있다.',
  },
  keyserver: {
    title: '올린다고 보증되지는 않는다',
    body: '키서버는 아무나 아무 이름으로 키를 올릴 수 있는 게시판에 가깝다. 거기 있다는 사실 자체는 아무 보증이 아니다. 값하는 것은 다른 데서 본 지문과 대조할 수 있다는 점, 그리고 그 키가 언제부터 거기 있었는지가 남는다는 점이다. 배포 사이트와 운영 주체가 완전히 다르다는 것도 이 채널의 몫이다.',
  },
  social: {
    title: '깨뜨리려면 여러 곳을 동시에 쥐어야 한다',
    body: '계정과 키를 서로 가리키게 묶어 두면, 키를 갈아치우려는 쪽은 배포 사이트만이 아니라 그 계정들까지 같은 시점에 장악해야 한다. 완벽하지는 않다. 한 사람이 쥔 계정 묶음이면 그 사람을 털면 끝이고, 과거 어느 시점에 무엇이 적혀 있었는지는 보는 사람의 기억에 달렸다. 그래도 이 표에서 동시 장악이 가장 비싼 줄이다.',
  },
  offline: {
    title: '바꿔치기는 어렵지만 확인도 어렵다',
    body: '대면으로 받은 지문이나 인쇄된 지문은 원격 공격자가 손댈 수 없다. 대신 검색이 안 되고, 키가 회전하면 그 종이는 조용히 틀린 값이 된다. 최초 신뢰를 세우는 데는 좋고 그 뒤로 계속 기대기에는 나쁘다. 이 채널의 역할은 딱 한 번, 첫 칸을 세우는 것이다.',
  },
};
