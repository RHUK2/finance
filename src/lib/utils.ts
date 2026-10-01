import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function pctChange(cur: number, prev: number): number {
  if (prev === 0) return 0;
  return Number((((cur - prev) / prev) * 100).toFixed(2));
}

// 비트코인 브랜드 오렌지. 차트 선·역사 배지·아이콘이 쓴다.
export const BTC_COLOR = '#f7931a';

export const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export const clamp01 = (n: number) => clamp(n, 0, 1);

// 표기 함수가 공유하는 부호 규칙. 절댓값을 포맷하고, 음수면 하이픈 대신 마이너스 부호
// "−"(U+2212)를 붙인다. 반올림해 0이 되면 부호를 뗀다(`-0.0%` 같은 음의 0을 찍지 않는다).
// plus는 양수에 "+"를 붙인다. 변화량처럼 방향이 값의 일부인 자리에서 쓴다.
function withSign(n: number, body: (abs: number) => string, plus = false): string {
  const text = body(Math.abs(n));
  if (!/[1-9]/.test(text)) return text;
  return `${n < 0 ? '−' : plus ? '+' : ''}${text}`;
}

// 부호 있는 정수 포맷. 원·만원 표기 함수가 이 부호 컨벤션을 공유한다.
export function formatSigned(n: number, locale = 'ko-KR'): string {
  return withSign(n, (a) => Math.round(a).toLocaleString(locale));
}

// 컴팩트 USD 포맷 ($1.2T / $3.4B / $5.6M / $7.8K / $90).
export function formatUsd(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${Math.round(n)}`;
}

// ── 가격 표기 ────────────────────────────────────────────────────────────
// 시세(주가·환율·원자재·코인 가격)처럼 자릿수를 그대로 보여야 하는 값. 줄여 찍는 formatUsd와
// 이름을 가른다. 통화 기호를 앞에 붙이고 천 단위 구분자를 늘 넣는다. 원화도 시세는 `₩` 접두로
// 찍어 금액(접미 `원`, formatWon)과 구분한다. 값이 없을 때의 자리표시('-')는 호출부 몫이다.

/** 달러 가격. 3650.2 → `$3,650.20`, `formatUsdPrice(97000.4, 0)` → `$97,000`, -1.5 → `−$1.50` */
export const formatUsdPrice = (n: number, digits = 2, { plus = false } = {}) =>
  withSign(
    n,
    (a) => `$${a.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`,
    plus,
  );

/** 원화 가격. 1380.4 → `₩1,380`, `formatKrwPrice(2650.37, 2)` → `₩2,650.37` */
export const formatKrwPrice = (n: number, digits = 0, { plus = false } = {}) =>
  withSign(
    n,
    (a) => `₩${a.toLocaleString('ko-KR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`,
    plus,
  );

// ── 한국어 통화·비율 표기 ────────────────────────────────────────────────
// 억으로 찍는 함수가 셋인 것은 입력 단위가 계산마다 다르기 때문이다. `formatEok`은 억,
// `formatEokFromMan`은 만원, `formatEokFromWon`은 원을 받는다. 예전에는 페이지마다
// `fmtEok`이라는 같은 이름을 로컬에 두어 파일을 열기 전에는 어느 단위를 넣어야 하는지
// 알 수 없었다. 이름 뒤 `From`이 입력 단위다. 음수 부호는 모두 withSign을 따른다.

/** 만원 단위 입력. 1234 → `1,234만원`, -50 → `−50만원` */
export const formatMan = (n: number) => `${formatSigned(n)}만원`;

/** 원 단위 입력. 1234567 → `1,234,567원`, -50 → `−50원` */
export const formatWon = (n: number) => `${formatSigned(n)}원`;

/**
 * 억 단위 입력. 3.25 → `3.3억`, `formatEok(1000, 0)` → `1,000억`, -1.5 → `−1.5억`
 *
 * 천 단위 구분자를 넣는 것은 네 자리 억(수천억 원 규모의 자본)을 다루는 자리가 있기 때문이다.
 * 구분자가 없으면 `5000억`이 되어 자릿수가 한눈에 안 읽힌다.
 */
export const formatEok = (n: number, digits = 1) =>
  `${withSign(n, (a) => a.toLocaleString('ko-KR', { minimumFractionDigits: digits, maximumFractionDigits: digits }))}억`;

/** 만원 단위 입력을 억으로. 52500 → `5.25억`, -5000 → `−0.50억`. plus면 양수에 `+`를 붙인다 */
export const formatEokFromMan = (n: number, digits = 2, { plus = false } = {}) =>
  `${withSign(n, (a) => (a / 10000).toFixed(digits), plus)}억`;

/** 원 단위 입력을 억으로. 접미사가 `억원`인 것은 법인 자본금 표기 관례다. 1.2e9 → `12억원` */
export const formatEokFromWon = (n: number) => `${withSign(n, (a) => Math.round(a / 1e8).toLocaleString('ko-KR'))}억원`;

/**
 * 백분율. 입력은 이미 퍼센트 단위(0~100)다. 12.345 → `12.3%`, -5 → `−5.0%`.
 * 0~1 비율은 호출부에서 ×100 해서 넘긴다. plus면 양수에 `+`를 붙인다(변화율).
 */
export const formatPct = (n: number, digits = 1, { plus = false } = {}) =>
  `${withSign(n, (a) => a.toFixed(digits), plus)}%`;

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
