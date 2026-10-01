import { loadBitcoinHistorical } from '@/lib/loaders/bitcoin-historical';
import { serveEndpoint } from '@/lib/loaders/serve';

export const dynamic = 'force-dynamic';

// 본문은 src/lib/loaders/bitcoin-historical.ts에 있다. 서버 prefetch(src/lib/prefetch.ts)도 같은 로더를 부른다.
export function GET() {
  return serveEndpoint('bitcoin-historical', loadBitcoinHistorical, 'Failed to fetch Coinbase BTC history');
}
