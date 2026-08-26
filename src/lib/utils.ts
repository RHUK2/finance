import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function pctChange(cur: number, prev: number): number {
  if (prev === 0) return 0;
  return Number((((cur - prev) / prev) * 100).toFixed(2));
}

// 비트코인 브랜드 오렌지. 차트·도넛·풀 색상에 공통 사용.
export const BTC_COLOR = '#f7931a';

export const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export const clamp01 = (n: number) => clamp(n, 0, 1);

// 부호 있는 정수 포맷. 음수는 하이픈 대신 마이너스 부호 "−"(U+2212)를 쓴다.
// money-creation·inflation 페이지가 공유하는 통화 표기 컨벤션.
export function formatSigned(n: number, locale = 'ko-KR'): string {
  return `${n < 0 ? '−' : ''}${Math.round(Math.abs(n)).toLocaleString(locale)}`;
}

// 컴팩트 USD 포맷 ($1.2T / $3.4B / $5.6M / $7.8K / $90).
export function formatUsd(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${Math.round(n)}`;
}

// ── 한국어 통화·비율 표기 ────────────────────────────────────────────────
// 억으로 찍는 함수가 셋인 것은 입력 단위가 페이지마다 다르기 때문이다. 전세는
// 억으로, 주택담보대출은 만원으로, 법인은 원으로 계산한다. 예전에는 세 페이지가
// 모두 `fmtEok`이라는 같은 이름을 로컬에 두어 파일을 열기 전에는 어느 단위를
// 넣어야 하는지 알 수 없었다. 이름 뒤 `From`이 입력 단위다.

/** 만원 단위 입력. 1234 → `1,234만원` */
export const formatMan = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}만원`;

/** 원 단위 입력. 1234567 → `1,234,567원` */
export const formatWon = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}원`;

/** 억 단위 입력. 3.25 → `3.3억` */
export const formatEok = (n: number, digits = 1) => `${n.toFixed(digits)}억`;

/** 만원 단위 입력을 억으로. 52500 → `5.25억` */
export const formatEokFromMan = (n: number, digits = 2) => `${(n / 10000).toFixed(digits)}억`;

/** 원 단위 입력을 억으로. 접미사가 `억원`인 것은 법인 자본금 표기 관례다. 1.2e9 → `12억원` */
export const formatEokFromWon = (n: number) => `${Math.round(n / 1e8).toLocaleString('ko-KR')}억원`;

/** 백분율. 12.345 → `12.3%` */
export const formatPct = (n: number, digits = 1) => `${n.toFixed(digits)}%`;

// 긴 16진 문자열을 표시용으로 앞부분만 자른다(hash·pubkey 등 공용 표기).
export function shortHex(hex: string, head = 10): string {
  return hex.length <= head ? hex : hex.slice(0, head) + '…';
}

// 시드 기반 난수 (리셋 시 동일 결과 재현).
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
