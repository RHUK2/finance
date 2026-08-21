// BIP-39 / BIP-32·44 개념 시연용 순수 계산 함수.
// ⚠️ 교육 목적의 단순화된 계산이다. 체크섬·시드·주소는 실제 암호 연산이 아니라
// 그럴듯하게 보이는 결정적 값(illustrative)이며, 실제 지갑/자금에 쓰면 안 된다.
// 엔트로피 → 11비트 청크 → 단어 인덱스 매핑만 실제 BIP-39 규칙을 그대로 따른다.

import { BIP39_WORDLIST } from './bip39-wordlist';
import { mulberry32 } from './utils';

import { ADDRESS_TYPES, type AddrType } from './address-types';

// 경로 선택 UI에 쓰는 짧은 이름. address-types.ts의 label은 스크립트 이름을 괄호로
// 달고 있어 purpose 드롭다운에는 길다.
const PURPOSE_LABEL: Record<AddrType, string> = {
  legacy: 'Legacy',
  nested: 'P2SH-SegWit',
  native: 'Native SegWit',
  taproot: 'Taproot',
};

export const ENTROPY_OPTIONS = [128, 160, 192, 224, 256] as const;
export type EntropyBits = (typeof ENTROPY_OPTIONS)[number];

// 엔트로피 비트수(ENT) → 체크섬 비트(CS=ENT/32) → 단어 수((ENT+CS)/11).
export function entropyBreakdown(bits: number) {
  const checksum = bits / 32;
  const total = bits + checksum;
  return { entropy: bits, checksum, total, words: total / 11 };
}

// 문자열 → 32비트 시드 (FNV-1a). mulberry32 시딩용.
function strToSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// 입력 문자열 + 문자셋으로부터 결정적 문자열 생성 (개념 시연용, 실제 해시 아님).
function illustrativeChars(input: string, charset: string, len: number): string {
  const rng = mulberry32(strToSeed(input));
  let out = '';
  for (let i = 0; i < len; i++) out += charset[Math.floor(rng() * charset.length)];
  return out;
}

// 결정적 hex 문자열.
export function illustrativeHex(input: string, chars: number): string {
  return illustrativeChars(input, '0123456789abcdef', chars);
}

// 무작위 엔트로피 hex 생성 (재생성 버튼용, 클라이언트 이벤트에서만 호출).
export function randomEntropyHex(bits: number): string {
  const chars = bits / 4;
  let out = '';
  for (let i = 0; i < chars; i++) out += Math.floor(Math.random() * 16).toString(16);
  return out;
}

export function hexToBits(hex: string): string {
  return hex
    .split('')
    .map((c) => parseInt(c, 16).toString(2).padStart(4, '0'))
    .join('');
}

export type MnemonicWord = {
  position: number; // 1-based
  index: number; // 0~2047
  word: string;
  bits: string; // 이 단어를 만든 11비트
  isChecksum: boolean; // 체크섬 비트를 포함하는 단어인지
};

// 개념 시연용 "SHA-256". 실제 해시가 아니라 입력에서 결정적으로 만든 가짜 256비트 값.
// (실제로는 crypto.subtle.digest("SHA-256", entropy)를 쓴다.)
export function illustrativeSha256(entropyHex: string): string {
  return illustrativeHex('checksum:' + entropyHex, 64);
}

// 엔트로피 → 체크섬 비트 = 해시의 앞 ENT/32 비트.
export function checksumBits(entropyHex: string): string {
  const cs = (entropyHex.length * 4) / 32;
  return hexToBits(illustrativeSha256(entropyHex)).slice(0, cs);
}

// 엔트로피 hex → 니모닉 단어 목록.
// 엔트로피 부분의 11비트 청크 → 인덱스 → 단어 매핑은 실제 BIP-39 규칙.
// 체크섬 비트는 개념 시연용(illustrative)으로 채운다.
export function entropyToMnemonic(entropyHex: string): MnemonicWord[] {
  const bits = entropyHex.length * 4;
  const csBits = checksumBits(entropyHex);
  const bitStr = hexToBits(entropyHex) + csBits;
  const n = bitStr.length / 11;
  const words: MnemonicWord[] = [];
  for (let i = 0; i < n; i++) {
    const chunk = bitStr.slice(i * 11, i * 11 + 11);
    const index = parseInt(chunk, 2);
    words.push({
      position: i + 1,
      index,
      word: BIP39_WORDLIST[index],
      bits: chunk,
      isChecksum: (i + 1) * 11 > bits, // 체크섬 비트가 걸치는 단어
    });
  }
  return words;
}

export function mnemonicString(words: MnemonicWord[]): string {
  return words.map((w) => w.word).join(' ');
}

// 니모닉 + passphrase → 512비트 시드 (개념 시연용; 실제는 PBKDF2-HMAC-SHA512 2048회).
export function mnemonicToSeed(mnemonic: string, passphrase: string): string {
  return illustrativeHex(`${mnemonic}::${passphrase}`, 128);
}

// BIP-44 purpose → 주소 타입 메타. 정체는 address-types.ts가 정한다.
// bodyLen은 접두어를 뺀 나머지 글자 수로 실제 주소 길이와 같게 맞춰 뒀다.
export const PURPOSES = ADDRESS_TYPES.map((t) => ({
  value: t.purpose.replace("'", ''),
  label: `${t.purpose} · ${PURPOSE_LABEL[t.value]}`,
  addr: t.script,
  prefix: t.prefix,
  charset: t.charset,
  bodyLen: t.bodyLen,
}));

export const COINS = [
  { value: '0', label: "0' · Bitcoin" },
  { value: '1', label: "1' · Testnet" },
] as const;

export type PathParts = {
  purpose: string;
  coin: string;
  account: number;
  change: 0 | 1;
  index: number;
};

export function buildPath(p: PathParts): string {
  return `m / ${p.purpose}' / ${p.coin}' / ${p.account}' / ${p.change} / ${p.index}`;
}

const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BECH32 = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

// 시드 + 경로 → 주소 모양 문자열 (개념 시연용).
export function illustrativeAddress(seedHex: string, path: string, purposeValue: string): string {
  const meta = PURPOSES.find((p) => p.value === purposeValue) ?? PURPOSES[0];
  const charset = meta.charset === 'bech32' ? BECH32 : BASE58;
  return meta.prefix + illustrativeChars(seedHex + path, charset, meta.bodyLen);
}
