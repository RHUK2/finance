import { loadStrategy } from '@/lib/loaders/strategy';
import { serveEndpoint } from '@/lib/loaders/serve';

export const dynamic = 'force-dynamic';

// 본문은 src/lib/loaders/strategy.ts에 있다. 서버 prefetch(src/lib/prefetch.ts)도 같은 로더를 부른다.
export function GET() {
  return serveEndpoint('strategy', loadStrategy, 'Failed to fetch strategy data');
}
