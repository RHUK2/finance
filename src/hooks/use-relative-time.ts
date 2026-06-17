"use client";

import { useEffect, useReducer } from "react";

function format(isoTimestamp: string): string {
  const diffMs = Date.now() - new Date(isoTimestamp).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  return `${Math.floor(diffHour / 24)}일 전`;
}

export function useRelativeTime(isoTimestamp: string | undefined): string {
  const [, rerender] = useReducer((c: number) => c + 1, 0);

  useEffect(() => {
    if (!isoTimestamp) return;
    const id = setInterval(rerender, 60_000);
    return () => clearInterval(id);
  }, [isoTimestamp]);

  if (!isoTimestamp) return "";
  return format(isoTimestamp);
}
