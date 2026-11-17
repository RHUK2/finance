import 'server-only';

import { NextResponse } from 'next/server';

import { describeError } from '@/lib/cache';
import type { EndpointKey } from '@/lib/cache-config';

/**
 * 라우트 핸들러 본문. 로더의 결과를 JSON으로 내보내고, 실패하면 키 이름을 붙여 로그를 남긴 뒤
 * 500을 돌려준다. 클라이언트(use-endpoint.ts)는 상태 코드와 본문의 error 문구를 오류 메시지에 담는다.
 */
export async function serveEndpoint(key: EndpointKey, load: () => Promise<unknown>, failure: string) {
  try {
    return NextResponse.json(await load());
  } catch (error) {
    console.error(`${key} fetch error:`, describeError(error));
    return NextResponse.json({ error: failure }, { status: 500 });
  }
}
