import { loadMiningStats } from '@/lib/loaders/mining-stats';
import { serveEndpoint } from '@/lib/loaders/serve';

export const dynamic = 'force-dynamic';

// 본문은 src/lib/loaders/mining-stats.ts에 있다. 서버 prefetch(src/lib/prefetch.ts)도 같은 로더를 부른다.
export function GET() {
  return serveEndpoint('mining-stats', loadMiningStats, 'Failed to fetch mining stats');
}
