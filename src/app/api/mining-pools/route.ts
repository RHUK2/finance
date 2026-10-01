import { loadMiningPools } from '@/lib/loaders/mining-pools';
import { serveEndpoint } from '@/lib/loaders/serve';

export const dynamic = 'force-dynamic';

// 본문은 src/lib/loaders/mining-pools.ts에 있다. 서버 prefetch(src/lib/prefetch.ts)도 같은 로더를 부른다.
export function GET() {
  return serveEndpoint('mining-pools', loadMiningPools, 'Failed to fetch mining pools');
}
