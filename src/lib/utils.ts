import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function pctChange(cur: number, prev: number): number {
  if (prev === 0) return 0;
  return Number((((cur - prev) / prev) * 100).toFixed(2));
}
