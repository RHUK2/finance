import type { NextConfig } from 'next';

// 응답 보안 헤더. HSTS는 Vercel이 붙이므로 여기 두지 않는다. CSP는 Next의 인라인 스크립트와
// 맞춰야 해서 아직 넣지 않았다.
const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
