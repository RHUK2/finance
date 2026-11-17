import 'server-only';

/** 전송 검증만 공통화한다. 필드별 타입·수치·시계열 검증은 호출부가 맡는다. */
export async function fetchJson<T>(
  url: string,
  label: string,
  { timeoutMs = 15_000, allowEmptyArray = false }: { timeoutMs?: number; allowEmptyArray?: boolean } = {},
): Promise<T> {
  try {
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: unknown = await res.json();
    if (
      data == null ||
      data === '' ||
      (Array.isArray(data) && data.length === 0 && !allowEmptyArray) ||
      (typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length === 0)
    ) {
      throw new Error('빈 응답');
    }
    return data as T;
  } catch (error) {
    // URL에는 FRED·ECOS 키가 들어갈 수 있으므로 원본 오류나 URL을 로그에 싣지 않는다.
    const reason =
      error instanceof Error && /^(HTTP \d{3}|빈 응답)$/.test(error.message)
        ? error.message
        : error instanceof Error && error.name === 'TimeoutError'
          ? '시간 초과'
          : '요청 또는 JSON 해석 실패';
    throw new Error(`${label}: ${reason}`);
  }
}

export function assertNonEmpty<T>(rows: T[], label: string): void {
  if (!Array.isArray(rows) || rows.length === 0) throw new Error(`${label}: 빈 시계열`);
}
