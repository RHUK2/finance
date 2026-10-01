import type { MetadataRoute } from 'next';
import { SITE_NAME } from '@/lib/nav';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: '비트코인과 거시경제 지표를 보여 주고, 그 지표를 움직이는 원리를 시뮬레이션으로 설명한다',
    start_url: '/',
    display: 'standalone',
    // 매니페스트는 미디어 쿼리를 받지 않아 라이트·다크 중 한 값만 적을 수 있다. globals.css의 기본
    // 팔레트(:root)가 라이트이고 다크는 그 위에 얹는 덮어쓰기라 라이트 --background(흰색)를 쓴다.
    // 다크 사용자의 설치 앱 스플래시는 흰색으로 뜬다. 브라우저 크롬 색은 layout.tsx의 themeColor가
    // 모드별로 따로 준다.
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
