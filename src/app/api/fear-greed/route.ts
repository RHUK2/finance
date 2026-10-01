import { loadFearGreed } from '@/lib/loaders/fear-greed';
import { serveEndpoint } from '@/lib/loaders/serve';

export const dynamic = 'force-dynamic';

// 본문은 src/lib/loaders/fear-greed.ts에 있다. 서버 prefetch(src/lib/prefetch.ts)도 같은 로더를 부른다.
export function GET() {
  return serveEndpoint('fear-greed', loadFearGreed, 'Failed to fetch fear & greed data');
}
