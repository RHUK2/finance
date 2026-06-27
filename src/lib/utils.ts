import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function pctChange(cur: number, prev: number): number {
  if (prev === 0) return 0;
  return Number((((cur - prev) / prev) * 100).toFixed(2));
}

export const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

export const clamp01 = (n: number) => clamp(n, 0, 1);

// 컴팩트 USD 포맷 ($1.2T / $3.4B / $5.6M / $7.8K / $90).
export function formatUsd(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${Math.round(n)}`;
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
