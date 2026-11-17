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
    // URL에는 FRED·ECOS 키가 들어갈 수 있으므로 원본 스택·중첩 cause는 전달하지 않는다.
    const reason =
      error instanceof Error && /^(HTTP \d{3}|빈 응답)$/.test(error.message)
        ? error.message
        : error instanceof Error && error.name === 'TimeoutError'
          ? '시간 초과'
          : '요청 또는 JSON 해석 실패';
    let cause: Error | undefined;
    if (error instanceof Error) {
      // URL이 든 메시지는 통째로 생략해 경로·쿼리의 키가 로그에 남지 않게 한다.
      const message =
        error.message.includes(url) || /[a-z][a-z\d+.-]*:\/\/|www\./i.test(error.message)
          ? 'URL이 포함된 오류 메시지 생략'
          : error.message;
      cause = new Error(message);
      cause.name = error instanceof SyntaxError ? 'SyntaxError' : error instanceof TypeError ? 'TypeError' : 'Error';
    }
    throw new Error(`${label}: ${reason}`, { cause });
  }
}

export function assertNonEmpty<T>(rows: T[], label: string): void {
  if (!Array.isArray(rows) || rows.length === 0) throw new Error(`${label}: 빈 시계열`);
}
