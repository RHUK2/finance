import { loadMvrv } from '@/lib/loaders/mvrv';
import { serveEndpoint } from '@/lib/loaders/serve';

export const dynamic = 'force-dynamic';

// 본문은 src/lib/loaders/mvrv.ts에 있다. 서버 prefetch(src/lib/prefetch.ts)도 같은 로더를 부른다.
export function GET() {
  return serveEndpoint('mvrv', loadMvrv, 'Failed to fetch MVRV data');
}
