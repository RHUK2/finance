"use client";

import { useEffect, useReducer } from "react";

const rtf = new Intl.RelativeTimeFormat("ko", { numeric: "always" });

/** epoch ms 기준 현재까지의 경과를 "방금 전" / "N분 전" / "N시간 전" / "N일 전"으로 포맷 */
export function formatRelativeTime(timestampMs: number): string {
  const diffMin = Math.floor((Date.now() - timestampMs) / 60_000);
  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return rtf.format(-diffMin, "minute");
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return rtf.format(-diffHour, "hour");
  return rtf.format(-Math.floor(diffHour / 24), "day");
}

export function useRelativeTime(isoTimestamp: string | undefined): string {
  const [, rerender] = useReducer((c: number) => c + 1, 0);

  useEffect(() => {
    if (!isoTimestamp) return;
    const id = setInterval(rerender, 60_000);
    return () => clearInterval(id);
  }, [isoTimestamp]);

  if (!isoTimestamp) return "";
  return formatRelativeTime(new Date(isoTimestamp).getTime());
}
